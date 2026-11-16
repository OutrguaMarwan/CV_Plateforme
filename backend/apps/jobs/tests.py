from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.candidates.models import CandidateProfile
from apps.jobs.models import OffreEmploi, TypeContrat


class JobsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="jobs-test-user",
            email="jobs.test@example.test",
            password="TestPassword!123",
        )
        CandidateProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

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

    def test_list_returns_active_offers_only(self):
        active_offer = self.create_offer("active")
        self.create_offer("inactive", active=False)

        response = self.client.get("/jobs/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], str(active_offer.pk))

    def test_detail_does_not_return_inactive_offer(self):
        inactive_offer = self.create_offer("inactive", active=False)

        response = self.client.get(f"/jobs/{inactive_offer.pk}")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)