from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.conf import settings
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import RegisterSerializer, UserSerializer
import os

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


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
