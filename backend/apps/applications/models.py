from django.db import models


class StatutCandidature(models.TextChoices):
    BROUILLON = "BROUILLON", "Brouillon"
    SOUMISE = "SOUMISE", "Soumise"
    EN_REVUE = "EN_REVUE", "En revue"
    ENTRETIEN = "ENTRETIEN", "Entretien"
    OFFRE = "OFFRE", "Offre"
    REFUSEE = "REFUSEE", "Refusée"


class Candidature(models.Model):
    profil = models.ForeignKey(
        "candidates.CandidateProfile",
        on_delete=models.CASCADE,
        related_name="candidatures",
    )
    offre = models.ForeignKey(
        "jobs.OffreEmploi",
        on_delete=models.CASCADE,
        related_name="candidatures",
    )
    statut = models.CharField(max_length=20, choices=StatutCandidature.choices)
    lettre_motivation = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    date_candidature = models.DateTimeField(auto_now_add=True)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.profil.user.email} — {self.offre.titre}"


class HistoriqueCandidature(models.Model):
    candidature = models.ForeignKey(
        Candidature,
        on_delete=models.CASCADE,
        related_name="historique",
    )
    ancien_statut = models.CharField(
        max_length=20,
        choices=StatutCandidature.choices,
    )
    nouveau_statut = models.CharField(
        max_length=20,
        choices=StatutCandidature.choices,
    )
    date_changement = models.DateTimeField(auto_now_add=True)
    commentaire = models.TextField(blank=True)

    def __str__(self):
        return f"{self.candidature} : {self.ancien_statut} → {self.nouveau_statut}"