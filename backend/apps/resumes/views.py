from uuid import uuid4

from django.core.files.storage import default_storage
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.candidates.models import CandidateProfile
from apps.resumes.models import AnalyseCV, CV, StatutAnalyse
from apps.resumes.serializers import CVAnalysisSerializer
from apps.accounts.models import User


MAX_CV_SIZE = 5 * 1024 * 1024


def get_candidate_profile(user):
    if user.role != User.Role.CANDIDAT:
        return None

    profile, _created = CandidateProfile.objects.get_or_create(user=user)
    return profile


class CVAnalysesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_candidate_profile(request.user)
        if profile is None:
            return Response([])

        analyses = (
            AnalyseCV.objects.filter(cv__profil=profile)
            .select_related("cv")
            .prefetch_related("preuves_competences__competence")
            .order_by("-date_analyse")
        )
        return Response(CVAnalysisSerializer(analyses, many=True).data)


class CVAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = get_candidate_profile(request.user)
        if profile is None:
            return Response(
                {"detail": "Profil candidat introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_file = request.FILES.get("file")
        if uploaded_file is None:
            return Response(
                {"detail": "Le fichier PDF est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > MAX_CV_SIZE:
            return Response(
                {"detail": "Le fichier ne doit pas dépasser 5 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        original_name = uploaded_file.name.replace("\\", "/").rsplit("/", 1)[-1]
        if not original_name.lower().endswith(".pdf"):
            return Response(
                {"detail": "Le fichier doit avoir l’extension PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        header = uploaded_file.read(5)
        uploaded_file.seek(0)
        if header != b"%PDF-":
            return Response(
                {"detail": "Le contenu du fichier n’est pas un PDF valide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_path = default_storage.save(
            f"cvs/{profile.pk}/{uuid4().hex}.pdf",
            uploaded_file,
        )

        with transaction.atomic():
            cv = CV.objects.create(
                profil=profile,
                nom_fichier=original_name[:255],
                chemin_stockage=stored_path,
            )
            analysis = AnalyseCV.objects.create(
                cv=cv,
                statut=StatutAnalyse.EN_COURS,
                score_correspondance=0,
                postes_suggeres=[],
                commentaires=[],
                avertissements=[
                    "L’analyse automatique du CV n’est pas encore activée."
                ],
            )

        analysis = (
            AnalyseCV.objects.filter(pk=analysis.pk)
            .select_related("cv")
            .prefetch_related("preuves_competences__competence")
            .get()
        )

        return Response(
            CVAnalysisSerializer(analysis).data,
            status=status.HTTP_201_CREATED,
        )