from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    coach_id = serializers.IntegerField(source="coach.id", read_only=True)
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "coach_id", "coach_name",
            "title", "content", "cover_image",
            "status", "view_count", "created_at", "updated_at",
        ]
        read_only_fields = ["view_count", "created_at", "updated_at", "coach_id", "coach_name"]

    def get_coach_name(self, obj):
        try:
            app = obj.coach.coach_application
            return f"{app.first_name} {app.last_name}"
        except Exception:
            return obj.coach.get_full_name() or obj.coach.username
