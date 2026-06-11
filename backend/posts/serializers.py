from rest_framework import serializers
from .models import Post, Tag


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

    class Meta:
        model = Post
        fields = [
            "id", "coach_id", "coach_name",
            "title", "content", "cover_image",
            "status", "view_count", "tags", "tag_names",
            "created_at", "updated_at",
        ]
        read_only_fields = ["view_count", "created_at", "updated_at", "coach_id", "coach_name", "tags"]

    def get_coach_name(self, obj):
        try:
            app = obj.coach.coach_application
            return f"{app.first_name} {app.last_name}"
        except Exception:
            return obj.coach.get_full_name() or obj.coach.username

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
