from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ModelViewSet
from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentViewSet(ModelViewSet):
    queryset = Appointment.objects.all().order_by("-created_at")
    serializer_class = AppointmentSerializer
