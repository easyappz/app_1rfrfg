from typing import Optional, Tuple

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class JWTAuthentication(BaseAuthentication):
    """Simple JWT auth that expects header: Authorization: Bearer <token>."""

    www_authenticate_realm = 'api'
    keyword = 'Bearer'

    def authenticate(self, request) -> Optional[Tuple[object, None]]:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise AuthenticationFailed('Invalid Authorization header format. Expected: Bearer <token>')

        token = parts[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationFailed('Invalid token payload')

        User = get_user_model()
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')

        return (user, None)

    def authenticate_header(self, request) -> str:
        return f'{self.keyword} realm="{self.www_authenticate_realm}"'
