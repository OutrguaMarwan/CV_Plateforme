from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from apps.candidates.models import CandidateProfile


User = get_user_model()


class AuthEndpointsTests(APITestCase):
    def test_register_creates_candidate_without_authenticating(self):
        response = self.client.post(
            "/auth/register",
            {
                "email": "new.user@example.test",
                "password": "T7!wQ9#zL2pA",
                "firstName": "Test",
                "lastName": "Utilisateur",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user"]["role"], "student")
        self.assertEqual(
            response.data["message"],
            "Compte créé. Vous pouvez maintenant vous connecter.",
        )
        self.assertNotIn("token", response.data)
        self.assertNotIn("refresh", response.data)
        self.assertNotIn("password", response.data["user"])
        self.assertTrue(User.objects.filter(email="new.user@example.test").exists())
        self.assertTrue(User.objects.filter(email="new.user@example.test").exists())
        self.assertTrue(
            CandidateProfile.objects.filter(
                user__email="new.user@example.test"
            ).exists()
        )

    def test_login_with_email_returns_tokens(self):
        password = "T7!wQ9#zL2pA"
        User.objects.create_user(
            username="auth-test-user",
            email="login.user@example.test",
            password=password,
            first_name="Test",
            last_name="Login",
        )

        response = self.client.post(
            "/auth/login",
            {"email": "login.user@example.test", "password": password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertIn("refresh", response.data)

    def test_me_requires_token_and_returns_current_user(self):
        unauthenticated = self.client.get("/auth/me")
        self.assertEqual(
            unauthenticated.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        user = User.objects.create_user(
            username="auth-me-user",
            email="me.user@example.test",
            password="T7!wQ9#zL2pA",
            first_name="Current",
            last_name="User",
        )
        login = self.client.post(
            "/auth/login",
            {"email": user.email, "password": "T7!wQ9#zL2pA"},
            format="json",
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login.data['token']}"
        )

        response = self.client.get("/auth/me")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], user.email)