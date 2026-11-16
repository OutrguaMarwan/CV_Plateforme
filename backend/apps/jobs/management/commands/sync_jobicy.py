import json
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.jobs.models import OffreEmploi, TypeContrat


API_URL = "https://jobicy.com/api/jobs"
STATUS_API_URL = "https://jobicy.com/api/jobs/status"
SOURCE = "jobicy"
STATUS_BATCH_SIZE = 100


class PlainTextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)


def plain_text(html):
    parser = PlainTextParser()
    parser.feed(html or "")
    return " ".join(" ".join(parser.parts).split())


class Command(BaseCommand):
    help = "Synchronise les annonces remote depuis l'API publique Jobicy."

    def get_json(self, url):
        request = Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "CVPlateforme/1.0",
            },
        )

        try:
            with urlopen(request, timeout=30) as response:
                raw_data = response.read().decode("utf-8")
        except HTTPError as error:
            raise CommandError(
                f"Jobicy a répondu avec HTTP {error.code}."
            ) from error
        except (URLError, TimeoutError) as error:
            raise CommandError(
                f"Impossible de contacter Jobicy : {error}"
            ) from error

        try:
            data = json.loads(raw_data)
        except json.JSONDecodeError as error:
            raise CommandError("Jobicy a renvoyé un JSON invalide.") from error

        if not isinstance(data, dict):
            raise CommandError("Format de réponse Jobicy inattendu.")

        return data

    def fetch_jobs(self):
        collected = {}

        for geo in ("emea", "anywhere"):
            cursor = None
            seen_cursors = set()

            while True:
                params = {"count": 100, "geo": geo}
                if cursor:
                    params["cursor"] = cursor

                payload = self.get_json(f"{API_URL}?{urlencode(params)}")
                jobs = payload.get("jobs")

                if not isinstance(jobs, list):
                    raise CommandError(
                        f"La réponse Jobicy ne contient pas de liste "
                        f"d'offres pour geo={geo}."
                    )

                for job in jobs:
                    if not isinstance(job, dict) or not job.get("id"):
                        raise CommandError(
                            "Une annonce Jobicy ne contient pas d'identifiant."
                        )
                    collected[str(job["id"])] = job

                next_cursor = payload.get("nextCursor")
                if not payload.get("hasMore") or not next_cursor:
                    break

                if next_cursor in seen_cursors:
                    raise CommandError(
                        f"Le curseur Jobicy se répète pour geo={geo}."
                    )

                seen_cursors.add(next_cursor)
                cursor = next_cursor

        return collected

    def normalize_job(self, job):
        title = str(job.get("jobTitle") or "").strip()
        company = str(job.get("companyName") or "").strip()
        location = str(job.get("jobGeo") or "À distance").strip()
        url = str(job.get("url") or "").strip()
        source_id = str(job.get("id") or "").strip()

        parsed_url = urlparse(url)
        if (
            parsed_url.scheme != "https"
            or parsed_url.netloc.lower() not in ("jobicy.com", "www.jobicy.com")
        ):
            raise CommandError(
                f"Lien Jobicy invalide pour l'annonce {source_id}."
            )

        if not source_id.isdigit():
            raise CommandError(
                f"Identifiant Jobicy invalide : {source_id!r}."
            )

        if not title or not company:
            raise CommandError(
                f"Titre ou entreprise absent pour l'annonce {source_id}."
            )

        if len(title) > 200 or len(company) > 200 or len(location) > 200:
            raise CommandError(
                f"Un champ dépasse la taille maximale pour l'annonce {source_id}."
            )

        published_at = parse_datetime(str(job.get("pubDate") or ""))
        if published_at is None:
            raise CommandError(
                f"Date de publication invalide pour l'annonce {source_id}."
            )
        if timezone.is_naive(published_at):
            published_at = timezone.make_aware(published_at)

        raw_types = job.get("jobType") or []
        if isinstance(raw_types, str):
            contract_types = raw_types.casefold()
        elif isinstance(raw_types, list):
            contract_types = " ".join(
                str(value) for value in raw_types
            ).casefold()
        else:
            contract_types = ""

        if "intern" in contract_types:
            contract_type = TypeContrat.STAGE
        elif "apprentice" in contract_types:
            contract_type = TypeContrat.ALTERNANCE
        elif "contract" in contract_types or "freelance" in contract_types:
            contract_type = TypeContrat.FREELANCE
        else:
            contract_type = TypeContrat.EMPLOI

        return {
            "titre": title,
            "entreprise": company,
            "localisation": location,
            "type_contrat": contract_type,
            "teletravail": True,
            "description": plain_text(job.get("jobDescription", "")),
            "date_publication": published_at,
            "date_limite": None,
            "url": url,
            "actif": True,
        }

    def update_offer_statuses(self):
        source_ids = list(
            OffreEmploi.objects.filter(source=SOURCE)
            .exclude(identifiant_source__isnull=True)
            .values_list("identifiant_source", flat=True)
        )

        status_counts = {"active": 0, "closed": 0, "unknown": 0}

        for offset in range(0, len(source_ids), STATUS_BATCH_SIZE):
            batch = source_ids[offset:offset + STATUS_BATCH_SIZE]
            params = {"ids": ",".join(batch)}
            payload = self.get_json(
                f"{STATUS_API_URL}?{urlencode(params)}"
            )
            jobs = payload.get("jobs")

            if not isinstance(jobs, list):
                raise CommandError(
                    "La réponse de statut Jobicy ne contient pas de liste."
                )

            for item in jobs:
                if not isinstance(item, dict):
                    raise CommandError(
                        "Entrée invalide dans la réponse de statut Jobicy."
                    )

                source_id = str(item.get("id") or "")
                current_status = item.get("status")

                if current_status not in status_counts:
                    raise CommandError(
                        f"Statut Jobicy inattendu pour {source_id}: "
                        f"{current_status!r}."
                    )

                status_counts[current_status] += 1

                if current_status == "unknown":
                    continue

                OffreEmploi.objects.filter(
                    source=SOURCE,
                    identifiant_source=source_id,
                ).update(actif=current_status == "active")

        return status_counts

    def handle(self, *args, **options):
        jobs = self.fetch_jobs()
        normalized_jobs = {
            source_id: self.normalize_job(job)
            for source_id, job in jobs.items()
        }

        created_count = 0
        updated_count = 0

        with transaction.atomic():
            for source_id, defaults in normalized_jobs.items():
                _offer, created = OffreEmploi.objects.update_or_create(
                    source=SOURCE,
                    identifiant_source=source_id,
                    defaults=defaults,
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1

        status_counts = self.update_offer_statuses()

        self.stdout.write(
            self.style.SUCCESS(
                f"Import Jobicy terminé : {created_count} nouvelles offres, "
                f"{updated_count} mises à jour. "
                f"Statuts vérifiés : {status_counts['active']} actives, "
                f"{status_counts['closed']} fermées, "
                f"{status_counts['unknown']} inconnues."
            )
        )