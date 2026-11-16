from django.urls import path

from apps.applications.views import ApplicationsListCreateView


urlpatterns = [
    path("", ApplicationsListCreateView.as_view(), name="applications-list"),
]