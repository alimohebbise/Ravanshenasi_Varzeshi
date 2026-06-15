import os
import uuid

from django.core.files.storage import default_storage
from django.db.models import Count, F
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Post, Tag, PostLike, PostComment, SaveCategory, SavedPost
from .serializers import (
    PostSerializer, TagSerializer, PostCommentSerializer,
    SaveCategorySerializer, SavedPostSerializer,
)
from .permissions import IsCoach, IsPostOwner

ALLOWED_CONTENT_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def _social_context(request, base_context):
    """Adds the requesting user's like/save state to a serializer context."""
    user = request.user
    if user.is_authenticated:
        base_context["liked_post_ids"] = set(
            PostLike.objects.filter(user=user).values_list("post_id", flat=True)
        )
        base_context["saved_post_categories"] = dict(
            SavedPost.objects.filter(user=user).values_list("post_id", "category_id")
        )
    return base_context


class PublicPostListView(generics.ListAPIView):
    """Published posts, optionally filtered by ?coach_id="""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Post.objects.filter(status=Post.PUBLISHED).select_related(
            "coach", "coach__coach_application"
        ).annotate(
            like_count=Count("likes", distinct=True),
            comment_count=Count("comments", distinct=True),
        )
        coach_id = self.request.query_params.get("coach_id")
        if coach_id:
            qs = qs.filter(coach_id=coach_id)
        return qs

    def get_serializer_context(self):
        return _social_context(self.request, super().get_serializer_context())


class MyPostListView(generics.ListAPIView):
    """Coach's own posts — all statuses, for the dashboard."""
    serializer_class = PostSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        qs = Post.objects.filter(coach=self.request.user).select_related(
            "coach", "coach__coach_application"
        ).prefetch_related("tags").annotate(
            like_count=Count("likes", distinct=True),
            comment_count=Count("comments", distinct=True),
        )
        tag = self.request.query_params.get("tag")
        if tag:
            qs = qs.filter(tags__name=tag)
        return qs


class TagListView(generics.ListAPIView):
    """All existing tags, for the tag picker's autocomplete suggestions."""
    serializer_class = TagSerializer
    permission_classes = [IsCoach]
    queryset = Tag.objects.all()
    pagination_class = None


class PostCreateView(generics.CreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsCoach]

    def perform_create(self, serializer):
        serializer.save(coach=self.request.user)


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsPostOwner()]

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.annotate(
            like_count=Count("likes", distinct=True),
            comment_count=Count("comments", distinct=True),
        )
        if self.request.method not in permissions.SAFE_METHODS:
            return qs
        # Coaches and owners can see their own drafts; public sees only published
        if user.is_authenticated and user.role in ("coach", "owner"):
            return qs
        return qs.filter(status=Post.PUBLISHED)

    def get_serializer_context(self):
        return _social_context(self.request, super().get_serializer_context())


@api_view(["POST"])
@permission_classes([IsCoach])
def upload_content_image(request):
    """Upload an image to embed inside post content via the rich text editor."""
    image = request.FILES.get("image")
    if not image:
        return Response({"error": "تصویری ارسال نشده است."}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(image.name)[1].lower()
    if ext not in ALLOWED_CONTENT_IMAGE_EXTENSIONS:
        return Response(
            {"error": "فقط تصاویر PNG و JPG مجاز هستند."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    filename = f"posts/content/{uuid.uuid4().hex}{ext}"
    saved_path = default_storage.save(filename, image)
    url = request.build_absolute_uri(default_storage.url(saved_path))
    return Response({"url": url}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def track_post_view(request, pk):
    post = get_object_or_404(Post, pk=pk, status=Post.PUBLISHED)
    Post.objects.filter(pk=pk).update(view_count=F("view_count") + 1)
    post.refresh_from_db(fields=["view_count"])
    return Response({"view_count": post.view_count})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_post_like(request, pk):
    post = get_object_or_404(Post, pk=pk, status=Post.PUBLISHED)
    like = PostLike.objects.filter(post=post, user=request.user).first()
    if like:
        like.delete()
        liked = False
    else:
        PostLike.objects.create(post=post, user=request.user)
        liked = True
    return Response({"liked": liked, "like_count": post.likes.count()})


class PostCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = PostCommentSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        post = get_object_or_404(Post, pk=self.kwargs["pk"], status=Post.PUBLISHED)
        return PostComment.objects.filter(post=post).select_related("user")

    def perform_create(self, serializer):
        post = get_object_or_404(Post, pk=self.kwargs["pk"], status=Post.PUBLISHED)
        serializer.save(post=post, user=self.request.user)


class SaveCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = SaveCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return SaveCategory.objects.filter(user=self.request.user).annotate(
            post_count=Count("saved_posts", distinct=True)
        )

    def create(self, request, *args, **kwargs):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"error": "نام دسته‌بندی الزامی است."}, status=status.HTTP_400_BAD_REQUEST)
        category, _ = SaveCategory.objects.get_or_create(user=request.user, name=name)
        category.post_count = category.saved_posts.count()
        serializer = self.get_serializer(category)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_post_save(request, pk):
    post = get_object_or_404(Post, pk=pk, status=Post.PUBLISHED)
    category_id = request.data.get("category_id")
    category = None
    if category_id:
        category = get_object_or_404(SaveCategory, pk=category_id, user=request.user)

    saved = SavedPost.objects.filter(user=request.user, post=post).first()
    if saved:
        if saved.category_id == (category.id if category else None):
            saved.delete()
            return Response({"saved": False, "category_id": None})
        saved.category = category
        saved.save()
        return Response({"saved": True, "category_id": category.id if category else None})

    SavedPost.objects.create(user=request.user, post=post, category=category)
    return Response({"saved": True, "category_id": category.id if category else None})


class SavedPostListView(generics.ListAPIView):
    serializer_class = SavedPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        qs = SavedPost.objects.filter(
            user=self.request.user, post__status=Post.PUBLISHED
        ).select_related(
            "post", "post__coach", "post__coach__coach_application", "category"
        ).prefetch_related("post__tags")
        category_id = self.request.query_params.get("category_id")
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs

    def get_serializer_context(self):
        return _social_context(self.request, super().get_serializer_context())
