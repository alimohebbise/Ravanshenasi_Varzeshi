from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CoachApplication

User = get_user_model()


class ApprovedCoachSerializer(serializers.ModelSerializer):
    """Public profile of an approved coach, used for the coaches directory."""
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = CoachApplication
        fields = [
            "user_id", "username",
            "first_name", "last_name",
            "bio", "expertise", "experience_years",
        ]


class CoachApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = CoachApplication
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "national_id",
            "date_of_birth",
            "educational_documents",
            "digital_signature",
            "bio",
            "expertise",
            "experience_years",
            "status",
            "created_at",
        ]
        read_only_fields = ["status", "created_at", "username", "email"]
