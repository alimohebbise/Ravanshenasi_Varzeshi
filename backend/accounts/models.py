from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("coach", "Coach"),
        ("athlete", "Athlete"),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES)


class CoachProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="coach_profile"
    )
    bio = models.TextField()
    expertise = models.CharField(max_length=255)
    experience_years = models.PositiveIntegerField()
    price_per_session = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Coach: {self.user.username}"


class AthleteProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="athlete_profile"
    )
    sport = models.CharField(max_length=100)
    level = models.CharField(max_length=50)

    def __str__(self):
        return f"Athlete: {self.user.username}"
