from rest_framework import serializers

from apps.jobs.models import OffreEmploi
from apps.skills.models import NiveauCompetence


NIVEAU_FRONTEND = {
    NiveauCompetence.DEBUTANT: "débutant",
    NiveauCompetence.INTERMEDIAIRE: "intermédiaire",
    NiveauCompetence.AVANCE: "avancé",
    NiveauCompetence.EXPERT: "expert",
}


class OffreEmploiSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField(source="titre", read_only=True)
    company = serializers.CharField(source="entreprise", read_only=True)
    location = serializers.CharField(source="localisation", read_only=True)
    remote = serializers.BooleanField(source="teletravail", read_only=True)
    postedAt = serializers.DateTimeField(source="date_publication", read_only=True)
    deadline = serializers.DateField(
        source="date_limite",
        read_only=True,
        allow_null=True,
    )
    source = serializers.CharField(read_only=True)
    logoColor = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    requirements = serializers.SerializerMethodField()
    requiredSkills = serializers.SerializerMethodField()
    niceToHave = serializers.SerializerMethodField()
    matchScore = serializers.SerializerMethodField()

    class Meta:
        model = OffreEmploi
        fields = (
            "id",
            "title",
            "company",
            "logoColor",
            "location",
            "remote",
            "type",
            "description",
            "requirements",
            "requiredSkills",
            "niceToHave",
            "postedAt",
            "deadline",
            "matchScore",
            "source",
            "url",
        )

    def get_logoColor(self, offer):
        colors = ("brand", "accent", "success", "warning", "navy")
        return colors[(offer.pk - 1) % len(colors)]

    def get_type(self, offer):
        return offer.type_contrat.lower()

    def get_requirements(self, offer):
        required_skills = offer.competences_requises.select_related(
            "competence"
        )
        return [item.competence.nom for item in required_skills]

    def get_requiredSkills(self, offer):
        required_skills = offer.competences_requises.select_related(
            "competence"
        )
        return [
            {
                "name": item.competence.nom,
                "level": NIVEAU_FRONTEND[item.niveau_requis],
                "weight": item.poids,
            }
            for item in required_skills
        ]

    def get_niceToHave(self, offer):
        return []

    def get_matchScore(self, offer):
        return self.context.get("match_scores", {}).get(offer.pk, 0)