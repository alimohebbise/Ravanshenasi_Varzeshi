from rest_framework import status
from rest_framework.test import APITestCase

from .models import Appointment


class AppointmentApiTests(APITestCase):
    list_url = "/api/appointments/appointments/"

    def appointment_payload(self, **overrides):
        payload = {
            "full_name": "Ali Rezaei",
            "phone": "09120000000",
            "date": "2026-07-01",
            "time": "10:30:00",
        }
        payload.update(overrides)
        return payload

    def test_create_appointment(self):
        response = self.client.post(self.list_url, self.appointment_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        appointment = Appointment.objects.get()
        self.assertEqual(appointment.full_name, "Ali Rezaei")
        self.assertEqual(appointment.phone, "09120000000")

    def test_list_appointments_ordered_by_newest_first(self):
        first = Appointment.objects.create(full_name="First", phone="111", date="2026-07-01", time="09:00:00")
        second = Appointment.objects.create(full_name="Second", phone="222", date="2026-07-02", time="09:00:00")

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in response.data]
        self.assertEqual(ids, [second.id, first.id])

    def test_create_appointment_requires_fields(self):
        response = self.client.post(self.list_url, {"full_name": "Ali Rezaei"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        for field in ("phone", "date", "time"):
            self.assertIn(field, response.data)
