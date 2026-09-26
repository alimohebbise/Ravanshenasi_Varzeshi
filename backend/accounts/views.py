from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ContactMessage
from .serializers import ContactMessageSerializer, RegisterSerializer, UserSerializer
import os

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class OnlineConnectionMessageView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle, UserRateThrottle]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class CoachContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "coach":
            raise PermissionDenied("Only coaches can view received connection requests.")
        return ContactMessage.objects.filter(recipient_coach=self.request.user).select_related("user")


class AdminContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "owner":
            raise PermissionDenied("Only site admins can view all user messages.")
        return ContactMessage.objects.select_related("user", "recipient_coach").all()


def serve_html(request, path):
    file_path = os.path.join(settings.BASE_DIR.parent, path)
    if os.path.exists(file_path) and file_path.endswith(".html"):
        with open(file_path, "r", encoding="utf-8") as f:
            return HttpResponse(f.read(), content_type="text/html")

    file_path_fa = os.path.join(settings.BASE_DIR.parent, "fa", path)
    if os.path.exists(file_path_fa) and file_path_fa.endswith(".html"):
        with open(file_path_fa, "r", encoding="utf-8") as f:
            return HttpResponse(f.read(), content_type="text/html")

    file_path_en = os.path.join(settings.BASE_DIR.parent, "en", path)
    if os.path.exists(file_path_en) and file_path_en.endswith(".html"):
        with open(file_path_en, "r", encoding="utf-8") as f:
            return HttpResponse(f.read(), content_type="text/html")

    return HttpResponse(status=404)
