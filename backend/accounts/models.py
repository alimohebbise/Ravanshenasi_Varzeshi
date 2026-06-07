from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("coach", "Coach"),
        ("athlete", "Athlete"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="athlete")
    phone_number = models.CharField(max_length=20, blank=True)

    @property
    def is_owner(self):
        return self.role == "owner"

    @property
    def is_coach(self):
        return self.role == "coach"

    @property
    def is_athlete(self):
        return self.role == "athlete"
