from django.urls import path
from .views import (
    PublicPostListView, MyPostListView, PostCreateView, PostDetailView,
    track_post_view, upload_content_image, TagListView,
)

urlpatterns = [
    path("", PublicPostListView.as_view(), name="post-list"),
    path("my/", MyPostListView.as_view(), name="my-posts"),
    path("create/", PostCreateView.as_view(), name="post-create"),
    path("upload-image/", upload_content_image, name="post-upload-image"),
    path("tags/", TagListView.as_view(), name="post-tags"),
    path("<int:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("<int:pk>/view/", track_post_view, name="track-post-view"),
]
