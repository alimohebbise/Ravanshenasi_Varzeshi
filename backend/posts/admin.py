from django.contrib import admin
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "coach", "status", "view_count", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "coach__username")
