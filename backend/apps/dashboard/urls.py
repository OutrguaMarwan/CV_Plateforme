from django.urls import path

from apps.dashboard.views import DashboardAnalyticsView


urlpatterns = [
    path("analytics", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
]