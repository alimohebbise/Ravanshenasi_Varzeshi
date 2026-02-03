from django.contrib import admin

# Register your models here.
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'date', 'time')
    list_filter = ('date',)
    search_fields = ('full_name', 'phone')
