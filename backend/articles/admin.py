from django.contrib import admin
from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ["title", "language", "category", "view_count"]
    list_filter = ["language", "category"]
    search_fields = ["title", "slug"]
    ordering = ["-view_count"]
