from django.db import models

from apps.skills.models import NiveauCompetence


class StatutAnalyse(models.TextChoices):
    EN_COURS = "EN_COURS", "En cours"
    TERMINEE = "TERMINEE", "Terminée"
    ECHEC = "ECHEC", "Échec"


class CV(models.Model):
    profil = models.ForeignKey(
        "candidates.CandidateProfile",
        on_delete=models.CASCADE,
        related_name="cv",
    )
    nom_fichier = models.CharField(max_length=255)
    chemin_stockage = models.CharField(max_length=500)
    date_televersement = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom_fichier


class AnalyseCV(models.Model):
    cv = models.ForeignKey(
        CV,
        on_delete=models.CASCADE,
        related_name="analyses",
    )
    statut = models.CharField(max_length=20, choices=StatutAnalyse.choices)
    score_correspondance = models.FloatField()
    postes_suggeres = models.JSONField(default=list)
    commentaires = models.JSONField(default=list)
    avertissements = models.JSONField(default=list)
    date_analyse = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analyse {self.cv.nom_fichier} — {self.statut}"


class PreuveCompetence(models.Model):
    analyse = models.ForeignKey(
        AnalyseCV,
        on_delete=models.CASCADE,
        related_name="preuves_competences",
    )
    competence = models.ForeignKey(
        "skills.Competence",
        on_delete=models.CASCADE,
        related_name="preuves_cv",
    )
    niveau_detecte = models.CharField(
        max_length=20,
        choices=NiveauCompetence.choices,
    )
    confiance = models.FloatField()
    extrait_cv = models.TextField()

    def __str__(self):
        return f"{self.competence.nom} — {self.analyse.cv.nom_fichier}"

    @property
    def cv_file_name(self):
        return self.analyse.cv.nom_fichier