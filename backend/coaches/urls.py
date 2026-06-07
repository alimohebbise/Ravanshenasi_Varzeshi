from django.urls import path
from .views import CoachApplicationCreateView, CoachApplicationListView, review_application, my_application

urlpatterns = [
    path("apply/", CoachApplicationCreateView.as_view(), name="coach-apply"),
    path("applications/", CoachApplicationListView.as_view(), name="coach-applications"),
    path("applications/<int:pk>/review/", review_application, name="review-application"),
    path("my-application/", my_application, name="my-application"),
]
