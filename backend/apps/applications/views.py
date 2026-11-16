from django.db import transaction
from django.db.models import Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import (
    Candidature,
    HistoriqueCandidature,
    StatutCandidature,
)
from apps.applications.serializers import CandidatureSerializer
from apps.candidates.models import CandidateProfile
from apps.jobs.models import OffreEmploi
from apps.matching.models import Correspondance


def match_scores_for(profile, offer_ids):
    matches = (
        Correspondance.objects.filter(
            profil=profile,
            offre_id__in=offer_ids,
        )
        .order_by("offre_id", "-date_calcul")
    )

    scores = {}
    for match in matches:
        scores.setdefault(match.offre_id, round(match.score))
    return scores


class ApplicationsListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response([])

        applications = (
            Candidature.objects.filter(profil=profile)
            .select_related("offre")
            .prefetch_related(
                "offre__competences_requises__competence",
                Prefetch(
                    "historique",
                    queryset=HistoriqueCandidature.objects.order_by(
                        "date_changement"
                    ),
                ),
            )
            .order_by("-date_candidature")
        )

        offer_ids = [item.offre_id for item in applications]
        serializer = CandidatureSerializer(
            applications,
            many=True,
            context={"match_scores": match_scores_for(profile, offer_ids)},
        )
        return Response(serializer.data)

    def post(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response(
                {"detail": "Profil candidat introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            offer_id = int(request.data.get("job_id"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "job_id doit être un identifiant valide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        today = timezone.localdate()
        offer = get_object_or_404(
            OffreEmploi.objects.filter(actif=True).filter(
                Q(date_limite__isnull=True) | Q(date_limite__gte=today)
            ),
            pk=offer_id,
        )

        if Candidature.objects.filter(profil=profile, offre=offer).exists():
            return Response(
                {"detail": "Vous avez déjà postulé à cette offre."},
                status=status.HTTP_409_CONFLICT,
            )

        cover_letter = request.data.get("cover_letter", "")
        if cover_letter is None:
            cover_letter = ""
        if not isinstance(cover_letter, str):
            return Response(
                {"detail": "cover_letter doit être du texte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            application = Candidature.objects.create(
                profil=profile,
                offre=offer,
                statut=StatutCandidature.SOUMISE,
                lettre_motivation=cover_letter,
            )
            HistoriqueCandidature.objects.create(
                candidature=application,
                ancien_statut=StatutCandidature.BROUILLON,
                nouveau_statut=StatutCandidature.SOUMISE,
            )

        serializer = CandidatureSerializer(
            application,
            context={
                "match_scores": match_scores_for(profile, [offer.pk]),
            },
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)