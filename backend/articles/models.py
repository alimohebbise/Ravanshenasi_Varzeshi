from django.db import models


class Article(models.Model):
    LANGUAGE_CHOICES = [("fa", "Persian"), ("en", "English")]

    slug = models.CharField(max_length=200)
    title = models.CharField(max_length=300)
    language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES)
    category = models.CharField(max_length=100, blank=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ["slug", "language"]

    def __str__(self):
        return f"{self.title} ({self.language})"
