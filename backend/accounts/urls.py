from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CoachContactMessageListView,
    AdminContactMessageListView,
    ContactMessageListView,
    ContactMessageReplyView,
    MessageRecipientListView,
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
    path("message-recipients/", MessageRecipientListView.as_view(), name="message-recipients"),
    path("contact-messages/threads/", ContactMessageListView.as_view(), name="contact-message-threads"),
    path("contact-messages/<int:pk>/reply/", ContactMessageReplyView.as_view(), name="contact-message-reply"),
    path("contact-messages/received/", CoachContactMessageListView.as_view(), name="received-contact-messages"),
    path("contact-messages/", AdminContactMessageListView.as_view(), name="admin-contact-messages"),
]
