from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ContactMessage
from .serializers import (
    ContactMessageSerializer,
    MessageRecipientSerializer,
    RegisterSerializer,
    UserSerializer,
)
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
        recipient = serializer.validated_data.get("recipient") or serializer.validated_data.get("recipient_coach")
        serializer.save(
            user=user,
            sender=user,
            recipient=recipient,
            recipient_coach=recipient if recipient and recipient.role == "coach" else None,
        )


class MessageRecipientListView(generics.ListAPIView):
    serializer_class = MessageRecipientSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        recipients = User.objects.filter(
            Q(role="owner") | Q(role="coach", coach_application__status="approved")
        ).distinct().order_by("role", "first_name", "last_name", "username")
        if self.request.user.is_authenticated:
            recipients = recipients.exclude(pk=self.request.user.pk)
        return recipients


class ContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        messages = ContactMessage.objects.filter(reply_to__isnull=True).select_related(
            "user", "sender", "recipient", "recipient_coach"
        ).prefetch_related("replies__sender")
        visible_threads = (
            Q(user=self.request.user)
            | Q(recipient=self.request.user)
            | Q(recipient_coach=self.request.user)
        )
        if self.request.user.role == "owner":
            visible_threads |= Q(recipient__isnull=True, recipient_coach__isnull=True)
        return messages.filter(visible_threads)


class ContactMessageReplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        original = get_object_or_404(ContactMessage, pk=pk, reply_to__isnull=True)
        is_owner_inbox = (
            request.user.role == "owner"
            and original.recipient is None
            and original.recipient_coach is None
        )
        if request.user not in (original.user, original.recipient, original.recipient_coach) and not is_owner_inbox:
            raise PermissionDenied("You are not a participant in this conversation.")
        if not original.user:
            raise ValidationError({"message": "This visitor message has no online account to reply to."})

        message = request.data.get("message", "").strip()
        if not message:
            raise ValidationError({"message": "A reply message is required."})

        recipient = original.user if request.user != original.user else (original.recipient or original.recipient_coach)
        if recipient is None:
            recipient = User.objects.filter(role="owner").exclude(pk=request.user.pk).first()
        if recipient is None:
            raise ValidationError({"message": "No recipient is available for this reply."})

        sender_name = request.user.get_full_name() or request.user.username
        reply = ContactMessage.objects.create(
            user=original.user,
            sender=request.user,
            recipient=recipient,
            recipient_coach=recipient if recipient.role == "coach" else None,
            reply_to=original,
            name=sender_name,
            email=request.user.email or original.email,
            subject=original.subject,
            message=message,
        )
        return Response(ContactMessageSerializer(reply).data, status=201)


class CoachContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "coach":
            raise PermissionDenied("Only coaches can view received connection requests.")
        return ContactMessage.objects.filter(
            recipient_coach=self.request.user, reply_to__isnull=True
        ).select_related("user", "sender", "recipient", "recipient_coach").prefetch_related("replies__sender")


class AdminContactMessageListView(generics.ListAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != "owner":
            raise PermissionDenied("Only site admins can view all user messages.")
        return ContactMessage.objects.filter(reply_to__isnull=True).select_related(
            "user", "sender", "recipient", "recipient_coach"
        ).prefetch_related("replies__sender").all()


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
