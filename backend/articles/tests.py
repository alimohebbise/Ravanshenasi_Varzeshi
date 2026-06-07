from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Article

User = get_user_model()


class ArticleListTests(APITestCase):
    def setUp(self):
        Article.objects.create(slug="football", title="فوتبال", language="fa", category="sports", view_count=10)
        Article.objects.create(slug="motivation", title="انگیزه", language="fa", category="psychology", view_count=25)
        Article.objects.create(slug="football", title="Football", language="en", category="sports", view_count=3)

    def test_list_filters_by_language(self):
        response = self.client.get("/api/articles/?lang=fa")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        slugs = {item["slug"] for item in response.data}
        self.assertEqual(slugs, {"football", "motivation"})
        self.assertTrue(all(item["language"] == "fa" for item in response.data))

    def test_list_orders_by_view_count_descending(self):
        response = self.client.get("/api/articles/?lang=fa")

        view_counts = [item["view_count"] for item in response.data]
        self.assertEqual(view_counts, sorted(view_counts, reverse=True))

    def test_list_defaults_to_persian_when_lang_missing(self):
        response = self.client.get("/api/articles/")

        slugs = {item["slug"] for item in response.data}
        self.assertEqual(slugs, {"football", "motivation"})


class TrackViewTests(APITestCase):
    def test_track_view_creates_article_on_first_visit(self):
        self.assertFalse(Article.objects.filter(slug="boxing", language="fa").exists())

        response = self.client.post(
            "/api/articles/boxing/view/",
            {"language": "fa", "title": "بوکس", "category": "martial_arts"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["view_count"], 1)
        article = Article.objects.get(slug="boxing", language="fa")
        self.assertEqual(article.title, "بوکس")
        self.assertEqual(article.category, "martial_arts")

    def test_track_view_increments_existing_count(self):
        Article.objects.create(slug="boxing", title="بوکس", language="fa", category="martial_arts", view_count=4)

        response = self.client.post("/api/articles/boxing/view/", {"language": "fa"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["view_count"], 5)

    def test_track_view_keeps_languages_independent(self):
        self.client.post("/api/articles/boxing/view/", {"language": "fa"}, format="json")
        self.client.post("/api/articles/boxing/view/", {"language": "en"}, format="json")
        self.client.post("/api/articles/boxing/view/", {"language": "fa"}, format="json")

        fa_article = Article.objects.get(slug="boxing", language="fa")
        en_article = Article.objects.get(slug="boxing", language="en")
        self.assertEqual(fa_article.view_count, 2)
        self.assertEqual(en_article.view_count, 1)

    def test_track_view_does_not_require_authentication(self):
        response = self.client.post("/api/articles/anxiety-sports/view/", {"language": "en"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
