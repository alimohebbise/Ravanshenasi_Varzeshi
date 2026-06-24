from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q


class User(AbstractUser):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("coach", "Coach"),
        ("athlete", "Athlete"),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default="athlete")
    phone_number = models.CharField(max_length=20, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["email"],
                condition=~Q(email=""),
                name="unique_non_blank_email",
            ),
            models.UniqueConstraint(
                fields=["phone_number"],
                condition=~Q(phone_number=""),
                name="unique_non_blank_phone_number",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = "owner"
        super().save(*args, **kwargs)

    @property
    def is_owner(self):
        return self.role == "owner"

    @property
    def is_coach(self):
        return self.role == "coach"

    @property
    def is_athlete(self):
        return self.role == "athlete"
