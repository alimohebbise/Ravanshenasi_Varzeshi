from django.urls import path
from .views import (
    PublicPostListView, MyPostListView, PostCreateView, PostDetailView,
    track_post_view, upload_content_image, TagListView,
    toggle_post_like, PostCommentListCreateView,
    SaveCategoryListCreateView, toggle_post_save, SavedPostListView,
)

urlpatterns = [
    path("", PublicPostListView.as_view(), name="post-list"),
    path("my/", MyPostListView.as_view(), name="my-posts"),
    path("create/", PostCreateView.as_view(), name="post-create"),
    path("upload-image/", upload_content_image, name="post-upload-image"),
    path("tags/", TagListView.as_view(), name="post-tags"),
    path("save-categories/", SaveCategoryListCreateView.as_view(), name="save-categories"),
    path("saved/", SavedPostListView.as_view(), name="saved-posts"),
    path("<int:pk>/", PostDetailView.as_view(), name="post-detail"),
    path("<int:pk>/view/", track_post_view, name="track-post-view"),
    path("<int:pk>/like/", toggle_post_like, name="post-like"),
    path("<int:pk>/comments/", PostCommentListCreateView.as_view(), name="post-comments"),
    path("<int:pk>/save/", toggle_post_save, name="post-save"),
]
