from django.db import models
from accounts.models import User

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    )

    athlete = models.ForeignKey(User, on_delete=models.CASCADE, related_name='athlete_appointments')
    coach = models.ForeignKey(User, on_delete=models.CASCADE, related_name='coach_appointments')

    date = models.DateField()
    time = models.TimeField()

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

