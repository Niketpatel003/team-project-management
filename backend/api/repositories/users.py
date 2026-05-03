from datetime import datetime, timezone

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from ..db import get_users_collection


def _utcnow():
    return datetime.now(timezone.utc)


def _as_object_id(value):
    return value if isinstance(value, ObjectId) else ObjectId(value)


def create_user(*, name, email, password_hash):
    payload = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }

    try:
        result = get_users_collection().insert_one(payload)
    except DuplicateKeyError as error:
        raise ValueError("An account with that email already exists.") from error

    return get_user_by_id(result.inserted_id)


def get_user_by_email(email):
    return get_users_collection().find_one({"email": email.lower()})


def get_user_by_id(user_id):
    return get_users_collection().find_one({"_id": _as_object_id(user_id)})


def get_users_by_ids(user_ids):
    ids = [_as_object_id(user_id) for user_id in user_ids]
    users = list(get_users_collection().find({"_id": {"$in": ids}}))
    users_by_id = {str(user["_id"]): user for user in users}
    return [users_by_id[str(object_id)] for object_id in ids if str(object_id) in users_by_id]
