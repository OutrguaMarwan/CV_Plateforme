from django.conf import settings
from django.db import models


class CandidateProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="candidate_profile",
    )
    phone = models.CharField(max_length=30, blank=True)
    location = models.CharField(max_length=150, blank=True)
    professional_title = models.CharField(max_length=150, blank=True)
    biography = models.TextField(blank=True)

    def __str__(self):
        return f"Profil de {self.user.email}"