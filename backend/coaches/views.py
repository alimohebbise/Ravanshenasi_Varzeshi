from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import CoachApplication
from .serializers import CoachApplicationSerializer, ApprovedCoachSerializer


class IsOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "owner"


class CoachApplicationCreateView(generics.CreateAPIView):
    serializer_class = CoachApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if CoachApplication.objects.filter(user=self.request.user).exists():
            raise ValidationError("You have already submitted a coach application.")
        serializer.save(user=self.request.user)


class CoachApplicationListView(generics.ListAPIView):
    serializer_class = CoachApplicationSerializer
    permission_classes = [IsOwner]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        qs = CoachApplication.objects.all().select_related("user")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-created_at")


@api_view(["POST"])
@permission_classes([IsOwner])
def review_application(request, pk):
    application = get_object_or_404(CoachApplication, pk=pk)
    action = request.data.get("action")

    if action == "approve":
        application.status = "approved"
        application.reviewed_at = timezone.now()
        application.save()
        application.user.role = "coach"
        application.user.save(update_fields=["role"])
        return Response({"message": "Application approved."})

    if action == "reject":
        application.status = "rejected"
        application.reviewed_at = timezone.now()
        application.save()
        return Response({"message": "Application rejected."})

    return Response({"error": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


class ApprovedCoachListView(generics.ListAPIView):
    """Public directory of approved coaches."""
    serializer_class = ApprovedCoachSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return CoachApplication.objects.filter(status="approved").select_related("user").order_by("first_name")


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_application(request):
    try:
        app = CoachApplication.objects.get(user=request.user)
        return Response(CoachApplicationSerializer(app).data)
    except CoachApplication.DoesNotExist:
        return Response(None)
