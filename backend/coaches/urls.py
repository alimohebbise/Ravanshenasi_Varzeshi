from django.urls import path
from .views import (
    CoachApplicationCreateView, CoachApplicationListView,
    review_application, my_application, ApprovedCoachListView,
    coach_public_profile,
)

urlpatterns = [
    path("apply/", CoachApplicationCreateView.as_view(), name="coach-apply"),
    path("applications/", CoachApplicationListView.as_view(), name="coach-applications"),
    path("applications/<int:pk>/review/", review_application, name="review-application"),
    path("my-application/", my_application, name="my-application"),
    path("approved/", ApprovedCoachListView.as_view(), name="approved-coaches"),
    path("<int:user_id>/profile/", coach_public_profile, name="coach-public-profile"),
]
