from rest_framework import serializers

from apps.resumes.models import AnalyseCV, StatutAnalyse
from apps.skills.models import NiveauCompetence


STATUS_LABELS = {
    StatutAnalyse.EN_COURS: "en cours",
    StatutAnalyse.TERMINEE: "terminé",
    StatutAnalyse.ECHEC: "échec",
}

LEVEL_LABELS = {
    NiveauCompetence.DEBUTANT: "débutant",
    NiveauCompetence.INTERMEDIAIRE: "intermédiaire",
    NiveauCompetence.AVANCE: "avancé",
    NiveauCompetence.EXPERT: "expert",
}


class CVAnalysisSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    fileName = serializers.CharField(source="cv.nom_fichier", read_only=True)
    uploadedAt = serializers.DateTimeField(
        source="cv.date_televersement",
        read_only=True,
    )
    status = serializers.SerializerMethodField()
    parsedSkills = serializers.SerializerMethodField()
    suggestedRoles = serializers.ListField(
        source="postes_suggeres",
        read_only=True,
    )
    matchScore = serializers.FloatField(
        source="score_correspondance",
        read_only=True,
    )
    feedback = serializers.ListField(source="commentaires", read_only=True)
    warnings = serializers.ListField(
        source="avertissements",
        read_only=True,
    )

    class Meta:
        model = AnalyseCV
        fields = (
            "id",
            "fileName",
            "uploadedAt",
            "status",
            "parsedSkills",
            "suggestedRoles",
            "matchScore",
            "feedback",
            "warnings",
        )

    def get_status(self, analysis):
        return STATUS_LABELS[analysis.statut]

    def get_parsedSkills(self, analysis):
        return [
            {
                "id": str(proof.pk),
                "name": proof.competence.nom,
                "category": proof.competence.categorie,
                "level": LEVEL_LABELS[proof.niveau_detecte],
                "score": round(proof.confiance * 100),
                "verified": True,
            }
            for proof in analysis.preuves_competences.all()
        ]