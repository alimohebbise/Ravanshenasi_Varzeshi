from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path("login/", auth_views.LoginView.as_view(template_name="accounts/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="home"), name="logout"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("owner/", views.owner_dashboard, name="owner-dashboard"),
    path("coach/", views.coach_dashboard, name="coach-dashboard"),
    path("athlete/", views.athlete_dashboard, name="athlete-dashboard"),
]
