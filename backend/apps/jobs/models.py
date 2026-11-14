from django.db import models

from apps.skills.models import NiveauCompetence


class TypeContrat(models.TextChoices):
    STAGE = "STAGE", "Stage"
    EMPLOI = "EMPLOI", "Emploi"
    ALTERNANCE = "ALTERNANCE", "Alternance"
    FREELANCE = "FREELANCE", "Freelance"


class OffreEmploi(models.Model):
    titre = models.CharField(max_length=200)
    entreprise = models.CharField(max_length=200)
    localisation = models.CharField(max_length=200)
    type_contrat = models.CharField(max_length=20, choices=TypeContrat.choices)
    teletravail = models.BooleanField()
    description = models.TextField()
    date_publication = models.DateTimeField()
    date_limite = models.DateField(null=True, blank=True)

    # Extension validée : conserver la provenance et le lien de l’annonce importée.
    source = models.CharField(max_length=50)
    url = models.URLField()

    def __str__(self):
        return f"{self.titre} — {self.entreprise}"


class CompetenceRequise(models.Model):
    offre = models.ForeignKey(
        OffreEmploi,
        on_delete=models.CASCADE,
        related_name="competences_requises",
    )
    competence = models.ForeignKey(
        "skills.Competence",
        on_delete=models.CASCADE,
        related_name="offres_requises",
    )
    niveau_requis = models.CharField(
        max_length=20,
        choices=NiveauCompetence.choices,
    )
    poids = models.FloatField()
    obligatoire = models.BooleanField()

    def __str__(self):
        return f"{self.competence.nom} — {self.offre.titre}"