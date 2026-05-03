from datetime import datetime, timezone
import random
import string

from bson import ObjectId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from ..db import get_projects_collection, get_tasks_collection


def _utcnow():
    return datetime.now(timezone.utc)


def _as_object_id(value):
    return value if isinstance(value, ObjectId) else ObjectId(value)


def generate_join_code(name):
    base = "".join(character for character in name.upper() if character.isalnum())[:6]
    base = base.ljust(6, "X")
    suffix = "".join(random.choices(string.digits, k=2))
    return f"{base}{suffix}"


def _build_join_code(name):
    for _ in range(10):
        candidate = generate_join_code(name)
        if not get_projects_collection().find_one({"join_code": candidate}):
            return candidate

    raise ValueError("Unable to generate a unique join code. Please try again.")


def create_project(*, name, description, color, admin_id):
    payload = {
        "name": name,
        "description": description,
        "color": color,
        "admin_id": _as_object_id(admin_id),
        "member_ids": [_as_object_id(admin_id)],
        "join_code": _build_join_code(name),
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }

    try:
        result = get_projects_collection().insert_one(payload)
    except DuplicateKeyError as error:
        raise ValueError("Unable to create project right now.") from error

    return get_project_by_id(result.inserted_id)


def get_project_by_id(project_id):
    return get_projects_collection().find_one({"_id": _as_object_id(project_id)})


def get_project_by_join_code(join_code):
    return get_projects_collection().find_one({"join_code": join_code})


def list_projects_for_user(user_id):
    return list(
        get_projects_collection().find({"member_ids": _as_object_id(user_id)}).sort("created_at", -1)
    )


def add_member_to_project(*, project_id, member_id):
    return get_projects_collection().find_one_and_update(
        {"_id": _as_object_id(project_id)},
        {
            "$addToSet": {"member_ids": _as_object_id(member_id)},
            "$set": {"updated_at": _utcnow()},
        },
        return_document=ReturnDocument.AFTER,
    )


def remove_member_from_project(*, project_id, member_id):
    project = get_projects_collection().find_one_and_update(
        {"_id": _as_object_id(project_id)},
        {
            "$pull": {"member_ids": _as_object_id(member_id)},
            "$set": {"updated_at": _utcnow()},
        },
        return_document=ReturnDocument.AFTER,
    )
    get_tasks_collection().update_many(
        {"project_id": _as_object_id(project_id), "assignee_id": _as_object_id(member_id)},
        {"$set": {"assignee_id": None, "updated_at": _utcnow()}},
    )
    return project
