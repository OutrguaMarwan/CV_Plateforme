from django.db import models


class NiveauCompetence(models.TextChoices):
    DEBUTANT = "DEBUTANT", "Débutant"
    INTERMEDIAIRE = "INTERMEDIAIRE", "Intermédiaire"
    AVANCE = "AVANCE", "Avancé"
    EXPERT = "EXPERT", "Expert"


class Competence(models.Model):
    nom = models.CharField(max_length=100)
    categorie = models.CharField(max_length=100)

    def __str__(self):
        return self.nom


class CompetenceProfil(models.Model):
    profil = models.ForeignKey(
        "candidates.CandidateProfile",
        on_delete=models.CASCADE,
        related_name="competences",
    )
    competence = models.ForeignKey(
        Competence,
        on_delete=models.CASCADE,
        related_name="profils",
    )
    niveau = models.CharField(max_length=20, choices=NiveauCompetence.choices)
    score = models.FloatField()
    verifiee = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.competence.nom} — {self.profil.user.email}"