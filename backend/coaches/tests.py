import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CoachApplication

User = get_user_model()

MEDIA_ROOT = tempfile.mkdtemp()


def make_file(name="doc.pdf"):
    return SimpleUploadedFile(name, b"file-bytes", content_type="application/pdf")


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class CoachApplicationCreateTests(APITestCase):
    url = "/api/coaches/apply/"

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.user = User.objects.create_user(username="athlete1", password="strongpass123", role="athlete")

    def application_payload(self):
        return {
            "first_name": "Ali",
            "last_name": "Rezaei",
            "national_id": "1234567890",
            "date_of_birth": "1990-01-01",
            "expertise": "Sports Psychology",
            "experience_years": 5,
            "bio": "Experienced coach.",
            "educational_documents": make_file("edu.pdf"),
            "digital_signature": make_file("sig.png"),
        }

    def test_requires_authentication(self):
        response = self.client.post(self.url, self.application_payload(), format="multipart")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_submit_application(self):
        self.client.force_authenticate(self.user)

        response = self.client.post(self.url, self.application_payload(), format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        application = CoachApplication.objects.get(user=self.user)
        self.assertEqual(application.status, "pending")
        self.assertEqual(application.first_name, "Ali")
        # Submitting an application must not change the user's role yet
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "athlete")

    def test_user_cannot_submit_a_second_application(self):
        self.client.force_authenticate(self.user)
        self.client.post(self.url, self.application_payload(), format="multipart")

        response = self.client.post(self.url, self.application_payload(), format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CoachApplication.objects.filter(user=self.user).count(), 1)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class CoachApplicationReviewTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.owner = User.objects.create_user(username="owner1", password="strongpass123", role="owner")
        self.athlete = User.objects.create_user(username="athlete1", password="strongpass123", role="athlete")
        self.application = CoachApplication.objects.create(
            user=self.athlete,
            first_name="Ali",
            last_name="Rezaei",
            national_id="1234567890",
            date_of_birth="1990-01-01",
            educational_documents=make_file("edu.pdf"),
            digital_signature=make_file("sig.png"),
        )

    def test_list_requires_owner_role(self):
        self.client.force_authenticate(self.athlete)

        response = self.client.get("/api/coaches/applications/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_list_applications(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get("/api/coaches/applications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["username"], "athlete1")

    def test_approve_promotes_user_to_coach(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            f"/api/coaches/applications/{self.application.id}/review/", {"action": "approve"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.athlete.refresh_from_db()
        self.assertEqual(self.application.status, "approved")
        self.assertEqual(self.athlete.role, "coach")

    def test_reject_keeps_user_as_athlete(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            f"/api/coaches/applications/{self.application.id}/review/", {"action": "reject"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.application.refresh_from_db()
        self.athlete.refresh_from_db()
        self.assertEqual(self.application.status, "rejected")
        self.assertEqual(self.athlete.role, "athlete")

    def test_review_rejects_invalid_action(self):
        self.client.force_authenticate(self.owner)

        response = self.client.post(
            f"/api/coaches/applications/{self.application.id}/review/", {"action": "bogus"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_athlete_cannot_review_applications(self):
        self.client.force_authenticate(self.athlete)

        response = self.client.post(
            f"/api/coaches/applications/{self.application.id}/review/", {"action": "approve"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


@override_settings(MEDIA_ROOT=MEDIA_ROOT)
class MyApplicationTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA_ROOT, ignore_errors=True)

    def setUp(self):
        self.athlete = User.objects.create_user(username="athlete1", password="strongpass123", role="athlete")

    def test_returns_null_when_no_application_exists(self):
        self.client.force_authenticate(self.athlete)

        response = self.client.get("/api/coaches/my-application/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_returns_application_status_when_exists(self):
        CoachApplication.objects.create(
            user=self.athlete,
            first_name="Ali",
            last_name="Rezaei",
            national_id="1234567890",
            date_of_birth="1990-01-01",
            educational_documents=make_file("edu.pdf"),
            digital_signature=make_file("sig.png"),
        )
        self.client.force_authenticate(self.athlete)

        response = self.client.get("/api/coaches/my-application/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "pending")
