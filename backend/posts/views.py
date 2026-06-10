import os
import uuid

from django.core.files.storage import default_storage
from django.db.models import F
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Post
from .serializers import PostSerializer
from .permissions import IsCoach, IsPostOwner

ALLOWED_CONTENT_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


class PublicPostListView(generics.ListAPIView):
    """Published posts, optionally filtered by ?coach_id="""
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Post.objects.filter(status=Post.PUBLISHED).select_related(
            "coach", "coach__coach_application"
        )
        coach_id = self.request.query_params.get("coach_id")
        if coach_id:
            qs = qs.filter(coach_id=coach_id)
        return qs


class MyPostListView(generics.ListAPIView):
    """Coach's own posts — all statuses, for the dashboard."""
    serializer_class = PostSerializer
    permission_classes = [IsCoach]

    def get_queryset(self):
        return Post.objects.filter(coach=self.request.user).select_related(
            "coach", "coach__coach_application"
        )


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
        if self.request.method not in permissions.SAFE_METHODS:
            return Post.objects.all()
        # Coaches and owners can see their own drafts; public sees only published
        if user.is_authenticated and user.role in ("coach", "owner"):
            return Post.objects.all()
        return Post.objects.filter(status=Post.PUBLISHED)


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
