from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CoachContactMessageListView,
    AdminContactMessageListView,
    MeView,
    OnlineConnectionMessageView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("online-connection/", OnlineConnectionMessageView.as_view(), name="online-connection"),
    path("contact-messages/received/", CoachContactMessageListView.as_view(), name="received-contact-messages"),
    path("contact-messages/", AdminContactMessageListView.as_view(), name="admin-contact-messages"),
]
