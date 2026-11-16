from django.urls import include, path

from apps.resumes.views import CVAnalysesView, CVAnalyzeView


urlpatterns = [
    path("analyses", CVAnalysesView.as_view(), name="cv-analyses"),
    path("analyze", CVAnalyzeView.as_view(), name="cv-analyze"),
]