from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Article
from .serializers import ArticleSerializer


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        lang = self.request.query_params.get("lang", "fa")
        return Article.objects.filter(language=lang).order_by("-view_count")


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def track_view(request, slug):
    lang = request.data.get("language", "fa")
    title = request.data.get("title", slug.replace("-", " ").title())
    category = request.data.get("category", "")

    article, _ = Article.objects.get_or_create(
        slug=slug,
        language=lang,
        defaults={"title": title, "category": category},
    )
    article.view_count += 1
    article.save(update_fields=["view_count"])
    return Response({"view_count": article.view_count})
