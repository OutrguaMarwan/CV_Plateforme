import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.candidates.models import CandidateProfile
from apps.resumes.models import AnalyseCV, CV


class CVEndpointsTests(APITestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)

        media_settings = override_settings(MEDIA_ROOT=self.temp_dir.name)
        media_settings.enable()
        self.addCleanup(media_settings.disable)

        self.user = User.objects.create_user(
            username="cv-test-user",
            email="cv.test@example.test",
            password="TestPassword!123",
        )
        self.profile = CandidateProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_upload_pdf_creates_pending_analysis_and_lists_it(self):
        uploaded_file = SimpleUploadedFile(
            "cv-test.pdf",
            b"%PDF-1.4\ncontenu de test",
            content_type="application/pdf",
        )

        upload_response = self.client.post(
            "/cv/analyze",
            {"file": uploaded_file},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(upload_response.data["status"], "en cours")
        self.assertEqual(upload_response.data["fileName"], "cv-test.pdf")
        self.assertEqual(CV.objects.filter(profil=self.profile).count(), 1)
        self.assertEqual(AnalyseCV.objects.count(), 1)

        list_response = self.client.get("/cv/analyses")

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["id"], upload_response.data["id"])

    def test_upload_rejects_non_pdf_content(self):
        uploaded_file = SimpleUploadedFile(
            "not-a-pdf.pdf",
            b"plain text, not a PDF",
            content_type="application/pdf",
        )

        response = self.client.post(
            "/cv/analyze",
            {"file": uploaded_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CV.objects.count(), 0)
        self.assertEqual(AnalyseCV.objects.count(), 0)