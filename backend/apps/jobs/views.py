from django.db.models import FloatField, OuterRef, Q, Subquery, Value
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.candidates.models import CandidateProfile
from apps.jobs.models import OffreEmploi, TypeContrat
from apps.jobs.serializers import OffreEmploiSerializer
from apps.matching.models import Correspondance


def active_offers_for_user(user):
    today = timezone.localdate()
    offers = (
        OffreEmploi.objects.filter(actif=True)
        .filter(Q(date_limite__isnull=True) | Q(date_limite__gte=today))
        .prefetch_related("competences_requises__competence")
        .order_by("-date_publication")
    )

    profile = CandidateProfile.objects.filter(user=user).first()
    if profile is None:
        return offers.annotate(
            match_score=Value(0.0, output_field=FloatField())
        )

    latest_match_score = (
        Correspondance.objects.filter(
            profil=profile,
            offre_id=OuterRef("pk"),
        )
        .order_by("-date_calcul")
        .values("score")[:1]
    )

    return offers.annotate(
        match_score=Coalesce(
            Subquery(latest_match_score, output_field=FloatField()),
            Value(0.0),
            output_field=FloatField(),
        )
    )


def serialize_offers(offers):
    scores = {
        offer.pk: round(offer.match_score or 0)
        for offer in offers
    }
    serializer = OffreEmploiSerializer(
        offers,
        many=True,
        context={"match_scores": scores},
    )
    return serializer.data


class JobsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        offers = active_offers_for_user(request.user)

        search = request.query_params.get("search", "").strip()
        if search:
            offers = offers.filter(
                Q(titre__icontains=search)
                | Q(entreprise__icontains=search)
                | Q(localisation__icontains=search)
            )

        contract_type = request.query_params.get("type", "").lower()
        if contract_type and contract_type != "all":
            valid_types = {
                value.lower(): value
                for value, _label in TypeContrat.choices
            }
            if contract_type not in valid_types:
                return Response(
                    {"detail": "Type de contrat invalide."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            offers = offers.filter(type_contrat=valid_types[contract_type])

        remote = request.query_params.get("remote")
        if remote is not None:
            if remote.lower() not in ("true", "false"):
                return Response(
                    {"detail": "Le filtre remote doit être true ou false."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            offers = offers.filter(teletravail=remote.lower() == "true")

        min_match = request.query_params.get("min_match")
        if min_match:
            try:
                minimum = float(min_match)
            except ValueError:
                return Response(
                    {"detail": "min_match doit être un nombre."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not 0 <= minimum <= 100:
                return Response(
                    {"detail": "min_match doit être compris entre 0 et 100."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            offers = offers.filter(match_score__gte=minimum)

        return Response(serialize_offers(list(offers)))


class JobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        offer = get_object_or_404(
            active_offers_for_user(request.user),
            pk=pk,
        )
        return Response(serialize_offers([offer])[0])


class RecommendedJobsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response([])

        today = timezone.localdate()
        matches = (
            Correspondance.objects.filter(
                profil=profile,
                offre__actif=True,
            )
            .filter(
                Q(offre__date_limite__isnull=True)
                | Q(offre__date_limite__gte=today)
            )
            .select_related("offre")
            .prefetch_related("offre__competences_requises__competence")
            .order_by("-score", "-date_calcul")
        )

        offers = []
        match_scores = {}

        for match in matches:
            if match.offre_id in match_scores:
                continue

            offers.append(match.offre)
            match_scores[match.offre_id] = round(match.score)

            if len(offers) == 4:
                break

        serializer = OffreEmploiSerializer(
            offers,
            many=True,
            context={"match_scores": match_scores},
        )
        return Response(serializer.data)