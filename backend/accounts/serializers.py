from django.contrib.auth import get_user_model
from rest_framework import serializers
from coaches.models import CoachApplication
from .models import ContactMessage

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "phone_number", "password", "confirm_password"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("کاربری با این ایمیل قبلاً ثبت‌نام کرده است.")
        return value

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("کاربری با این شماره تلفن قبلاً ثبت‌نام کرده است.")
        return value

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "phone_number", "first_name", "last_name", "role"]


class ContactMessageSerializer(serializers.ModelSerializer):
    recipient_coach = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="coach"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "recipient_coach", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_recipient_coach(self, coach):
        if coach and not CoachApplication.objects.filter(user=coach, status="approved").exists():
            raise serializers.ValidationError("Only approved coaches can receive connection requests.")
        return coach
