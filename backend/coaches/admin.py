from django.contrib import admin
from django.utils import timezone
from .models import CoachApplication


@admin.register(CoachApplication)
class CoachApplicationAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "user", "expertise", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["first_name", "last_name", "user__username", "national_id"]
    actions = ["approve_applications", "reject_applications"]

    @admin.action(description="Approve selected applications")
    def approve_applications(self, request, queryset):
        for app in queryset.filter(status="pending"):
            app.status = "approved"
            app.reviewed_at = timezone.now()
            app.save()
            app.user.role = "coach"
            app.user.save(update_fields=["role"])

    @admin.action(description="Reject selected applications")
    def reject_applications(self, request, queryset):
        queryset.filter(status="pending").update(status="rejected", reviewed_at=timezone.now())
