from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings


DEFAULT_EXPIRES = timedelta(days=7)


def generate_jwt(user_id: int, expires: timedelta = DEFAULT_EXPIRES) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        'user_id': user_id,
        'exp': now + expires,
        'iat': now,
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    # PyJWT>=2 returns str
    return token
