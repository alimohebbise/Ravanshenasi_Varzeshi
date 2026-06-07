from django.contrib.auth import get_user_model
from django.core.management import call_command
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
