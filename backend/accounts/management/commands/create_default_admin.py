import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Ensures a default admin (owner) account exists and that all superusers have role=owner."

    def handle(self, *args, **options):
        User = get_user_model()

        promoted = User.objects.filter(is_superuser=True).exclude(role="owner").update(role="owner")
        if promoted:
            self.stdout.write(self.style.SUCCESS(f"Promoted {promoted} existing superuser(s) to role=owner."))

        username = os.environ.get("DEFAULT_ADMIN_USERNAME", "admin")
        if User.objects.filter(username=username).exists():
            self.stdout.write(f"Admin user '{username}' already exists, skipping creation.")
            return

        password = os.environ.get("DEFAULT_ADMIN_PASSWORD", "admin12345")
        email = os.environ.get("DEFAULT_ADMIN_EMAIL", "admin@ravanshenasi-varzeshi.local")
        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f"Created default admin account '{username}'."))
