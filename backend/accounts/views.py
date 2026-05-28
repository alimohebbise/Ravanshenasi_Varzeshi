from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required, user_passes_test
import os


def home(request):
    return render(request, "index.html")


def role_required(role):
    def check(user):
        return user.is_authenticated and user.role == role
    return user_passes_test(check, login_url="accounts:dashboard")


@login_required(login_url="accounts:login")
def dashboard(request):
    if request.user.role == "owner":
        return redirect("accounts:owner-dashboard")
    if request.user.role == "coach":
        return redirect("accounts:coach-dashboard")
    return redirect("accounts:athlete-dashboard")


@role_required("owner")
def owner_dashboard(request):
    return render(request, "accounts/owner_dashboard.html")


@role_required("coach")
def coach_dashboard(request):
    return render(request, "accounts/coach_dashboard.html")


@role_required("athlete")
def athlete_dashboard(request):
    return render(request, "accounts/athlete_dashboard.html")


def serve_html(request, path):
    # Try root first
    file_path = os.path.join(settings.BASE_DIR.parent, path)
    if os.path.exists(file_path) and file_path.endswith(".html"):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return HttpResponse(content, content_type="text/html")

    # Try fa/ subdirectory
    file_path_fa = os.path.join(settings.BASE_DIR.parent, "fa", path)
    if os.path.exists(file_path_fa) and file_path_fa.endswith(".html"):
        with open(file_path_fa, "r", encoding="utf-8") as f:
            content = f.read()
        return HttpResponse(content, content_type="text/html")

    # Try en/ subdirectory
    file_path_en = os.path.join(settings.BASE_DIR.parent, "en", path)
    if os.path.exists(file_path_en) and file_path_en.endswith(".html"):
        with open(file_path_en, "r", encoding="utf-8") as f:
            content = f.read()
        return HttpResponse(content, content_type="text/html")

    return HttpResponse(status=404)
