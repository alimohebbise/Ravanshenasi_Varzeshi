from django.contrib.auth import get_user_model
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
