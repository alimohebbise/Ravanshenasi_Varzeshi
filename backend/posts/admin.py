from django.contrib import admin
from .models import Post, PostLike, PostComment, SaveCategory, SavedPost


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "coach", "status", "view_count", "created_at")
    list_filter = ("status",)
    search_fields = ("title", "coach__username")


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")
    search_fields = ("post__title", "user__username")


@admin.register(PostComment)
class PostCommentAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "created_at")
    search_fields = ("post__title", "user__username", "content")


@admin.register(SaveCategory)
class SaveCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")
    search_fields = ("name", "user__username")


@admin.register(SavedPost)
class SavedPostAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "category", "created_at")
    search_fields = ("post__title", "user__username")
