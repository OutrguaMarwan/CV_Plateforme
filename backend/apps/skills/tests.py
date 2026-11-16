from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.candidates.models import CandidateProfile
from apps.jobs.models import CompetenceRequise, OffreEmploi, TypeContrat
from apps.skills.models import Competence, NiveauCompetence


class SkillEndpointsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="skills-test-user",
            email="skills.test@example.test",
            password="TestPassword!123",
        )
        CandidateProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

        self.skill = Competence.objects.create(
            nom="Python",
            categorie="Programmation",
        )

    def create_offer(self, source_id, active=True):
        return OffreEmploi.objects.create(
            titre=f"Poste {source_id}",
            entreprise="Entreprise test",
            localisation="À distance",
            type_contrat=TypeContrat.EMPLOI,
            teletravail=True,
            description="Description de test",
            date_publication=timezone.now(),
            source="test",
            identifiant_source=source_id,
            url=f"https://example.test/jobs/{source_id}",
            actif=active,
        )

    def test_skill_gaps_use_active_offers_only(self):
        active_offer = self.create_offer("active")
        inactive_offer = self.create_offer("inactive", active=False)

        CompetenceRequise.objects.create(
            offre=active_offer,
            competence=self.skill,
            niveau_requis=NiveauCompetence.AVANCE,
            poids=1,
            obligatoire=True,
        )
        CompetenceRequise.objects.create(
            offre=inactive_offer,
            competence=Competence.objects.create(
                nom="Java",
                categorie="Programmation",
            ),
            niveau_requis=NiveauCompetence.EXPERT,
            poids=1,
            obligatoire=True,
        )

        response = self.client.get("/skills/gaps")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["skill"]["name"], "Python")
        self.assertEqual(response.data[0]["requiredLevel"], "avancé")