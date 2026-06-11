from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class LenientJWTAuthentication(JWTAuthentication):
    """JWTAuthentication that treats an invalid/expired token as
    "no credentials" instead of raising 401.

    Without this, a stale access token in the client's storage causes
    AllowAny views (public coach profiles, post lists, articles, ...) to
    return 401, since DRF authentication runs before permission checks.
    Views that require authentication are unaffected: an anonymous user
    still fails IsAuthenticated and gets a 401 from the permission check.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None
