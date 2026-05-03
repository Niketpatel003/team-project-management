from dataclasses import dataclass

from bson import ObjectId
from rest_framework import authentication, exceptions

from .repositories.users import get_user_by_id
from .utils.jwt_tokens import decode_access_token


@dataclass
class AuthenticatedUser:
    id: str
    name: str
    email: str

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def pk(self):
        return self.id


class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")

        if not header:
            return None

        parts = header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise exceptions.AuthenticationFailed("Invalid authorization header.")

        token = parts[1]

        try:
            payload = decode_access_token(token)
            user_id = payload.get("sub")
            if not user_id:
                raise exceptions.AuthenticationFailed("Token payload is invalid.")

            user = get_user_by_id(ObjectId(user_id))
            if not user:
                raise exceptions.AuthenticationFailed("User no longer exists.")
        except Exception as error:
            if isinstance(error, exceptions.AuthenticationFailed):
                raise
            raise exceptions.AuthenticationFailed("Authentication failed.") from error

        auth_user = AuthenticatedUser(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
        )
        return auth_user, token
