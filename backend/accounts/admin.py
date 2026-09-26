from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import ContactMessage, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Extra", {"fields": ("role", "phone_number")}),
    )
    list_display = ("username", "email", "phone_number", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "name", "email", "recipient_coach", "user", "created_at", "is_resolved")
    list_filter = ("is_resolved", "recipient_coach", "created_at")
    list_editable = ("is_resolved",)
    search_fields = ("subject", "name", "email", "message")
    readonly_fields = ("created_at",)
