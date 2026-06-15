from rest_framework import serializers
from .models import Post, Tag, PostComment, SaveCategory, SavedPost


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class PostSerializer(serializers.ModelSerializer):
    coach_id = serializers.IntegerField(source="coach.id", read_only=True)
    coach_name = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50, allow_blank=True),
        write_only=True, required=False,
    )
    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    saved_category_id = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "coach_id", "coach_name",
            "title", "content", "cover_image",
            "status", "view_count", "tags", "tag_names",
            "like_count", "comment_count", "is_liked", "is_saved", "saved_category_id",
            "created_at", "updated_at",
        ]
        read_only_fields = ["view_count", "created_at", "updated_at", "coach_id", "coach_name", "tags"]

    def get_coach_name(self, obj):
        try:
            app = obj.coach.coach_application
            return f"{app.first_name} {app.last_name}"
        except Exception:
            return obj.coach.get_full_name() or obj.coach.username

    def get_like_count(self, obj):
        count = getattr(obj, "like_count", None)
        if count is not None:
            return count
        return obj.likes.count()

    def get_comment_count(self, obj):
        count = getattr(obj, "comment_count", None)
        if count is not None:
            return count
        return obj.comments.count()

    def get_is_liked(self, obj):
        liked_ids = self.context.get("liked_post_ids")
        if liked_ids is not None:
            return obj.id in liked_ids
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(user=request.user).exists()

    def get_is_saved(self, obj):
        saved_map = self.context.get("saved_post_categories")
        if saved_map is not None:
            return obj.id in saved_map
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return SavedPost.objects.filter(user=request.user, post=obj).exists()

    def get_saved_category_id(self, obj):
        saved_map = self.context.get("saved_post_categories")
        if saved_map is not None:
            return saved_map.get(obj.id)
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        saved = SavedPost.objects.filter(user=request.user, post=obj).first()
        return saved.category_id if saved else None

    def _set_tags(self, post, tag_names):
        if tag_names is None:
            return
        tags = []
        for name in tag_names:
            name = name.strip()
            if not name:
                continue
            tag, _ = Tag.objects.get_or_create(name=name)
            tags.append(tag)
        post.tags.set(tags)

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        post = super().create(validated_data)
        self._set_tags(post, tag_names)
        return post

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        post = super().update(instance, validated_data)
        self._set_tags(post, tag_names)
        return post


class PostCommentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = PostComment
        fields = ["id", "user_id", "user_name", "content", "created_at"]
        read_only_fields = ["id", "user_id", "user_name", "created_at"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class SaveCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = SaveCategory
        fields = ["id", "name", "post_count", "created_at"]
        read_only_fields = ["id", "post_count", "created_at"]

    def get_post_count(self, obj):
        count = getattr(obj, "post_count", None)
        if count is not None:
            return count
        return obj.saved_posts.count()


class SavedPostSerializer(serializers.ModelSerializer):
    post = PostSerializer(read_only=True)
    category_id = serializers.IntegerField(source="category.id", read_only=True, default=None)
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)

    class Meta:
        model = SavedPost
        fields = ["id", "post", "category_id", "category_name", "created_at"]
