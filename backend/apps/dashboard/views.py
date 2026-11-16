from datetime import timedelta

from django.db.models import Avg, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.applications.models import Candidature, StatutCandidature
from apps.candidates.models import CandidateProfile
from apps.matching.models import Correspondance
from apps.skills.models import CompetenceProfil


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = CandidateProfile.objects.filter(user=request.user).first()

        if profile:
            applications = Candidature.objects.filter(profil=profile)
            correspondence = Correspondance.objects.filter(profil=profile)
        else:
            applications = Candidature.objects.none()
            correspondence = Correspondance.objects.none()

        today = timezone.localdate()
        start_date = today - timedelta(days=6)

        daily_activity = (
            applications.filter(
                date_candidature__date__range=(start_date, today)
            )
            .annotate(day=TruncDate("date_candidature"))
            .values("day")
            .annotate(value=Count("id"))
        )
        activity_by_day = {
            row["day"]: row["value"] for row in daily_activity
        }

        
        weekly_activity = [
            {
                "day": (start_date + timedelta(days=offset)).strftime("%Y-%m-%d"),
                "value": activity_by_day.get(
                    start_date + timedelta(days=offset), 0
                ),
            }
            for offset in range(7)
        ]

        if profile:
            skill_rows = (
                CompetenceProfil.objects.filter(profil=profile)
                .values("competence__categorie")
                .annotate(count=Count("id"))
                .order_by("competence__categorie")
            )
            profile_fields = [
                profile.phone,
                profile.location,
                profile.professional_title,
                profile.biography,
                profile.cv.exists(),
                profile.competences.exists(),
            ]
            profile_completion = round(
                sum(bool(value) for value in profile_fields)
                * 100
                / len(profile_fields)
            )
        else:
            skill_rows = []
            profile_completion = 0

        average_score = correspondence.aggregate(value=Avg("score"))["value"]

        return Response(
            {
                "applicationsCount": applications.count(),
                "interviewsCount": applications.filter(
                    statut=StatutCandidature.ENTRETIEN
                ).count(),
                "offersCount": applications.filter(
                    statut=StatutCandidature.OFFRE
                ).count(),
                "profileCompletion": profile_completion,
                "averageMatchScore": round(average_score or 0),
                "weeklyActivity": weekly_activity,
                "skillsDistribution": [
                    {
                        "category": row["competence__categorie"],
                        "count": row["count"],
                    }
                    for row in skill_rows
                ],
            }
        )