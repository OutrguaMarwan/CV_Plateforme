from django.urls import path

from apps.skills.views import SkillGapsView, SkillsListView


urlpatterns = [
    path("", SkillsListView.as_view(), name="skills-list"),
    path("gaps", SkillGapsView.as_view(), name="skills-gaps"),
]