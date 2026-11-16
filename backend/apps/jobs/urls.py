from django.urls import path

from apps.jobs.views import JobDetailView, JobsListView, RecommendedJobsView


urlpatterns = [
    path("", JobsListView.as_view(), name="jobs-list"),
    path("recommended", RecommendedJobsView.as_view(), name="jobs-recommended"),
    path("<int:pk>", JobDetailView.as_view(), name="jobs-detail"),
]