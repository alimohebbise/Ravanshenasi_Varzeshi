from django.urls import path
from .views import ArticleListView, track_view

urlpatterns = [
    path("", ArticleListView.as_view(), name="article-list"),
    path("<str:slug>/view/", track_view, name="track-view"),
]
