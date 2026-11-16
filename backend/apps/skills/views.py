from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.candidates.models import CandidateProfile
from apps.jobs.models import CompetenceRequise
from apps.skills.models import CompetenceProfil, NiveauCompetence


LEVEL_LABELS = {
    NiveauCompetence.DEBUTANT: "débutant",
    NiveauCompetence.INTERMEDIAIRE: "intermédiaire",
    NiveauCompetence.AVANCE: "avancé",
    NiveauCompetence.EXPERT: "expert",
}

LEVEL_RANKS = {
    NiveauCompetence.DEBUTANT: 1,
    NiveauCompetence.INTERMEDIAIRE: 2,
    NiveauCompetence.AVANCE: 3,
    NiveauCompetence.EXPERT: 4,
}

LEVEL_SCORES = {
    NiveauCompetence.DEBUTANT: 25,
    NiveauCompetence.INTERMEDIAIRE: 50,
    NiveauCompetence.AVANCE: 75,
    NiveauCompetence.EXPERT: 100,
}


def serialize_skill(competence, candidate_skill=None):
    if candidate_skill is None:
        level = NiveauCompetence.DEBUTANT
        score = 0
        verified = False
        skill_id = competence.pk
    else:
        level = candidate_skill.niveau
        score = candidate_skill.score
        verified = candidate_skill.verifiee
        skill_id = candidate_skill.pk

    return {
        "id": str(skill_id),
        "name": competence.nom,
        "category": competence.categorie,
        "level": LEVEL_LABELS[level],
        "score": score,
        "verified": verified,
    }


class SkillsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response([])

        candidate_skills = (
            CompetenceProfil.objects.filter(profil=profile)
            .select_related("competence")
            .order_by("competence__nom")
        )

        return Response([
            serialize_skill(item.competence, item)
            for item in candidate_skills
        ])


class SkillGapsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()
        if profile is None:
            return Response([])

        today = timezone.localdate()
        requirements = (
            CompetenceRequise.objects.filter(
                obligatoire=True,
                offre__actif=True,
            )
            .filter(
                Q(offre__date_limite__isnull=True)
                | Q(offre__date_limite__gte=today)
            )
            .select_related("competence")
            .order_by("competence__nom")
        )

        required_by_competence = {}
        for requirement in requirements:
            competence = requirement.competence
            current = required_by_competence.get(competence.pk)

            if (
                current is None
                or LEVEL_RANKS[requirement.niveau_requis]
                > LEVEL_RANKS[current[1]]
            ):
                required_by_competence[competence.pk] = (
                    competence,
                    requirement.niveau_requis,
                )

        candidate_skills = (
            CompetenceProfil.objects.filter(profil=profile)
            .select_related("competence")
            .order_by("-score")
        )
        current_by_competence = {}
        for item in candidate_skills:
            current_by_competence.setdefault(item.competence_id, item)

        gaps = []
        for competence, required_level in required_by_competence.values():
            current_skill = current_by_competence.get(competence.pk)
            current_level = (
                current_skill.niveau
                if current_skill is not None
                else NiveauCompetence.DEBUTANT
            )
            current_score = (
                current_skill.score
                if current_skill is not None
                else 0
            )
            gap = max(0, LEVEL_SCORES[required_level] - round(current_score))

            if gap == 0:
                continue

            gaps.append({
                "skill": serialize_skill(competence, current_skill),
                "requiredLevel": LEVEL_LABELS[required_level],
                "currentLevel": LEVEL_LABELS[current_level],
                "gap": gap,
            })

        return Response(gaps)