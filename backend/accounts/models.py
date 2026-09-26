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


class ContactMessage(models.Model):
    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="contact_messages",
    )
    recipient_coach = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="received_contact_messages",
    )
    name = models.CharField(max_length=150)
    email = models.EmailField()
    subject = models.CharField(max_length=150)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.subject
