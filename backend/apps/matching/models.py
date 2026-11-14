from django.db import models


class Correspondance(models.Model):
    profil = models.ForeignKey(
        "candidates.CandidateProfile",
        on_delete=models.CASCADE,
        related_name="correspondances",
    )
    offre = models.ForeignKey(
        "jobs.OffreEmploi",
        on_delete=models.CASCADE,
        related_name="correspondances",
    )
    score = models.FloatField()
    explication = models.TextField()
    date_calcul = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.score} — {self.profil.user.email} / {self.offre.titre}"