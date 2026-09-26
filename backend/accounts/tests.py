from django.contrib.auth import get_user_model
from django.core.management import call_command
from accounts.models import ContactMessage
from coaches.models import CoachApplication
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RegisterTests(APITestCase):
    url = "/api/auth/register/"

    def valid_payload(self, **overrides):
        payload = {
            "username": "athlete1",
            "phone_number": "09120000000",
            "email": "athlete1@example.com",
            "password": "strongpass123",
            "confirm_password": "strongpass123",
        }
        payload.update(overrides)
        return payload

    def test_register_creates_user_with_athlete_role(self):
        response = self.client.post(self.url, self.valid_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="athlete1")
        self.assertEqual(user.role, "athlete")
        self.assertEqual(user.phone_number, "09120000000")
        self.assertTrue(user.check_password("strongpass123"))

    def test_register_rejects_password_mismatch(self):
        response = self.client.post(
            self.url,
            self.valid_payload(confirm_password="different123"),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("confirm_password", response.data)
        self.assertFalse(User.objects.filter(username="athlete1").exists())

    def test_register_rejects_duplicate_username(self):
        User.objects.create_user(username="athlete1", password="x12345678")

        response = self.client.post(self.url, self.valid_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)


class LoginTests(APITestCase):
    url = "/api/auth/login/"

    def setUp(self):
        self.user = User.objects.create_user(
            username="athlete1", password="strongpass123", role="athlete"
        )

    def test_login_returns_jwt_pair_for_valid_credentials(self):
        response = self.client.post(
            self.url, {"username": "athlete1", "password": "strongpass123"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_rejects_invalid_credentials(self):
        response = self.client.post(
            self.url, {"username": "athlete1", "password": "wrongpass"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SuperuserRoleTests(APITestCase):
    def test_creating_a_superuser_sets_owner_role(self):
        user = User.objects.create_superuser(username="root", email="root@example.com", password="x12345678")

        self.assertEqual(user.role, "owner")

    def test_promoting_existing_user_to_superuser_sets_owner_role(self):
        user = User.objects.create_user(username="someone", password="x12345678", role="athlete")

        user.is_superuser = True
        user.save()

        user.refresh_from_db()
        self.assertEqual(user.role, "owner")


class CreateDefaultAdminCommandTests(APITestCase):
    def test_creates_admin_account_when_missing(self):
        call_command("create_default_admin")

        admin = User.objects.get(username="admin")
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.role, "owner")
        self.assertTrue(admin.check_password("admin12345"))

    def test_is_idempotent_and_does_not_duplicate(self):
        call_command("create_default_admin")
        call_command("create_default_admin")

        self.assertEqual(User.objects.filter(username="admin").count(), 1)

    def test_promotes_existing_superusers_to_owner(self):
        legacy = User.objects.create_user(username="legacy", password="x12345678", role="athlete")
        User.objects.filter(pk=legacy.pk).update(is_superuser=True, is_staff=True)

        call_command("create_default_admin")

        legacy.refresh_from_db()
        self.assertEqual(legacy.role, "owner")


class MeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="athlete1",
            password="strongpass123",
            role="athlete",
            first_name="Ali",
            last_name="Rezaei",
        )

    def test_me_requires_authentication(self):
        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user_profile(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "athlete1")
        self.assertEqual(response.data["first_name"], "Ali")
        self.assertEqual(response.data["role"], "athlete")


class OnlineConnectionMessageTests(APITestCase):
    url = "/api/auth/online-connection/"

    def create_approved_coach(self, username):
        coach = User.objects.create_user(username=username, password="strongpass123", role="coach")
        CoachApplication.objects.create(
            user=coach,
            first_name="Test",
            last_name="Coach",
            national_id=f"{coach.pk:010}",
            date_of_birth="1990-01-01",
            educational_documents="education.pdf",
            digital_signature="signature.pdf",
            status="approved",
        )
        return coach

    def valid_payload(self):
        return {
            "name": "Ali Rezaei",
            "email": "ali@example.com",
            "subject": "Account question",
            "message": "Please help me update my account.",
        }

    def test_anonymous_user_can_submit_a_message_for_admin_review(self):
        response = self.client.post(self.url, self.valid_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        contact_message = ContactMessage.objects.get()
        self.assertEqual(contact_message.email, "ali@example.com")
        self.assertIsNone(contact_message.user)
        self.assertIsNone(contact_message.recipient_coach)
        self.assertFalse(contact_message.is_resolved)

    def test_authenticated_user_is_associated_with_message(self):
        user = User.objects.create_user(username="athlete", password="strongpass123")
        self.client.force_authenticate(user)

        response = self.client.post(self.url, self.valid_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.get().user, user)

    def test_message_can_be_addressed_to_an_approved_coach(self):
        coach = self.create_approved_coach("coach1")
        payload = self.valid_payload()
        payload["recipient_coach"] = coach.pk

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.get().recipient_coach, coach)

    def test_unapproved_coach_cannot_receive_connection_requests(self):
        coach = User.objects.create_user(username="pending", password="strongpass123", role="coach")
        payload = self.valid_payload()
        payload["recipient_coach"] = coach.pk

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ContactMessage.objects.exists())

    def test_coach_inbox_only_returns_messages_addressed_to_that_coach(self):
        coach = self.create_approved_coach("coach1")
        other_coach = self.create_approved_coach("coach2")
        first_payload = self.valid_payload()
        first_payload["recipient_coach"] = coach.pk
        second_payload = self.valid_payload()
        second_payload["recipient_coach"] = other_coach.pk
        self.client.post(self.url, first_payload, format="json")
        self.client.post(self.url, second_payload, format="json")
        self.client.force_authenticate(coach)

        response = self.client.get("/api/auth/contact-messages/received/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["recipient_coach"], coach.pk)

    def test_invalid_email_is_rejected(self):
        payload = self.valid_payload()
        payload["email"] = "not-an-email"

        response = self.client.post(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(ContactMessage.objects.exists())
