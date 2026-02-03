from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, CoachProfile, AthleteProfile


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'coach':
            CoachProfile.objects.create(user=instance)
        elif instance.role == 'athlete':
            AthleteProfile.objects.create(user=instance)
