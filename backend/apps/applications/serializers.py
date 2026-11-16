from rest_framework import serializers

from apps.applications.models import Candidature, StatutCandidature
from apps.jobs.serializers import OffreEmploiSerializer


STATUS_FRONTEND = {
    StatutCandidature.BROUILLON: "brouillon",
    StatutCandidature.SOUMISE: "soumise",
    StatutCandidature.EN_REVUE: "en revue",
    StatutCandidature.ENTRETIEN: "entretien",
    StatutCandidature.OFFRE: "offre",
    StatutCandidature.REFUSEE: "refusée",
}


class CandidatureSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    jobId = serializers.CharField(source="offre_id", read_only=True)
    job = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    appliedAt = serializers.DateTimeField(
        source="date_candidature",
        read_only=True,
    )
    updatedAt = serializers.DateTimeField(
        source="date_mise_a_jour",
        read_only=True,
    )
    coverLetter = serializers.CharField(
        source="lettre_motivation",
        read_only=True,
    )
    history = serializers.SerializerMethodField()

    class Meta:
        model = Candidature
        fields = (
            "id",
            "jobId",
            "job",
            "status",
            "appliedAt",
            "updatedAt",
            "coverLetter",
            "notes",
            "history",
        )

    def get_job(self, application):
        return OffreEmploiSerializer(
            application.offre,
            context={
                "match_scores": self.context.get("match_scores", {}),
            },
        ).data

    def get_status(self, application):
        return STATUS_FRONTEND[application.statut]

    def get_history(self, application):
        return [
            {
                "status": STATUS_FRONTEND[item.nouveau_statut],
                "date": item.date_changement,
            }
            for item in application.historique.all()
        ]