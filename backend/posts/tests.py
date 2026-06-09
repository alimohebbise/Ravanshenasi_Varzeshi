from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Post

User = get_user_model()


def make_user(username, role="athlete", **kwargs):
    return User.objects.create_user(username=username, password="pass1234", role=role, **kwargs)


def make_post(coach, title="Test Post", status_=Post.PUBLISHED, **kwargs):
    return Post.objects.create(coach=coach, title=title, content="body", status=status_, **kwargs)


class PostCreateTests(APITestCase):
    def setUp(self):
        self.coach = make_user("coach1", role="coach")
        self.athlete = make_user("athlete1", role="athlete")

    def test_coach_can_create_post(self):
        self.client.force_authenticate(self.coach)
        res = self.client.post("/api/posts/create/", {"title": "New Post", "content": "body", "status": "draft"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.filter(coach=self.coach).count(), 1)

    def test_athlete_cannot_create_post(self):
        self.client.force_authenticate(self.athlete)
        res = self.client.post("/api/posts/create/", {"title": "Bad Post", "content": "body"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_cannot_create_post(self):
        res = self.client.post("/api/posts/create/", {"title": "Anon Post", "content": "body"}, format="json")
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class PublicPostListTests(APITestCase):
    def setUp(self):
        self.coach = make_user("coach1", role="coach")
        self.published = make_post(self.coach, title="Pub", status_=Post.PUBLISHED)
        self.draft = make_post(self.coach, title="Draft", status_=Post.DRAFT)

    def test_public_list_returns_only_published(self):
        res = self.client.get("/api/posts/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        titles = [p["title"] for p in res.data]
        self.assertIn("Pub", titles)
        self.assertNotIn("Draft", titles)

    def test_filter_by_coach_id(self):
        other = make_user("coach2", role="coach")
        make_post(other, title="Other pub", status_=Post.PUBLISHED)
        res = self.client.get(f"/api/posts/?coach_id={self.coach.id}")
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["title"], "Pub")


class MyPostListTests(APITestCase):
    def setUp(self):
        self.coach = make_user("coach1", role="coach")

    def test_coach_sees_own_drafts_and_published(self):
        make_post(self.coach, title="Draft", status_=Post.DRAFT)
        make_post(self.coach, title="Pub", status_=Post.PUBLISHED)
        self.client.force_authenticate(self.coach)
        res = self.client.get("/api/posts/my/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_athlete_cannot_access_my_posts(self):
        athlete = make_user("athlete1", role="athlete")
        self.client.force_authenticate(athlete)
        res = self.client.get("/api/posts/my/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


class PostUpdateDeleteTests(APITestCase):
    def setUp(self):
        self.coach = make_user("coach1", role="coach")
        self.other_coach = make_user("coach2", role="coach")
        self.post = make_post(self.coach)

    def test_coach_can_update_own_post(self):
        self.client.force_authenticate(self.coach)
        res = self.client.patch(f"/api/posts/{self.post.id}/", {"title": "Updated"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.title, "Updated")

    def test_coach_cannot_update_others_post(self):
        self.client.force_authenticate(self.other_coach)
        res = self.client.patch(f"/api/posts/{self.post.id}/", {"title": "Hack"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_coach_can_delete_own_post(self):
        self.client.force_authenticate(self.coach)
        res = self.client.delete(f"/api/posts/{self.post.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Post.objects.filter(id=self.post.id).exists())


class TrackPostViewTests(APITestCase):
    def setUp(self):
        self.coach = make_user("coach1", role="coach")
        self.post = make_post(self.coach, status_=Post.PUBLISHED)

    def test_view_increments_count(self):
        res = self.client.post(f"/api/posts/{self.post.id}/view/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.post.refresh_from_db()
        self.assertEqual(self.post.view_count, 1)

    def test_draft_cannot_be_tracked(self):
        draft = make_post(self.coach, status_=Post.DRAFT)
        res = self.client.post(f"/api/posts/{draft.id}/view/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
