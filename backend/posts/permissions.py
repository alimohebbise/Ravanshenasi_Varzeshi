from rest_framework import permissions


class IsCoach(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("coach", "owner")


class IsPostOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == "owner":
            return True
        return obj.coach == request.user
