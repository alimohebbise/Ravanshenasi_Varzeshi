from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import serve_html

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/articles/", include("articles.urls")),
    path("api/coaches/", include("coaches.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/appointments/", include("appointments.urls")),
    # Serve existing HTML article files for iframe embedding
    re_path(r'^(?P<path>.*\.html)$', serve_html),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
