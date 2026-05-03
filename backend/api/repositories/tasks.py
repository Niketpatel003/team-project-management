from datetime import date, datetime, time, timezone

from bson import ObjectId
from pymongo import ReturnDocument

from ..db import get_tasks_collection


def _utcnow():
    return datetime.now(timezone.utc)


def _as_object_id(value):
    return value if isinstance(value, ObjectId) else ObjectId(value)


def _mongo_due_date(value):
    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, time.min, tzinfo=timezone.utc)
    return value


def create_task(*, project_id, creator_id, title, description, due_date, priority, status, assignee_id):
    payload = {
        "project_id": _as_object_id(project_id),
        "creator_id": _as_object_id(creator_id),
        "title": title,
        "description": description,
        "due_date": _mongo_due_date(due_date),
        "priority": priority,
        "status": status,
        "assignee_id": _as_object_id(assignee_id) if assignee_id else None,
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }
    result = get_tasks_collection().insert_one(payload)
    return get_task_by_id(result.inserted_id)


def get_task_by_id(task_id):
    return get_tasks_collection().find_one({"_id": _as_object_id(task_id)})


def list_tasks_for_project(project_id):
    return list(get_tasks_collection().find({"project_id": _as_object_id(project_id)}).sort("due_date", 1))


def list_tasks_for_projects(project_ids):
    ids = [_as_object_id(project_id) for project_id in project_ids]
    return list(get_tasks_collection().find({"project_id": {"$in": ids}}).sort("due_date", 1))


def list_tasks_for_assignee(user_id):
    return list(get_tasks_collection().find({"assignee_id": _as_object_id(user_id)}).sort("due_date", 1))


def update_task(task_id, updates):
    next_updates = dict(updates)
    next_updates["updated_at"] = _utcnow()
    if "assignee_id" in next_updates:
        next_updates["assignee_id"] = (
            _as_object_id(next_updates["assignee_id"]) if next_updates["assignee_id"] else None
        )
    if "due_date" in next_updates:
        next_updates["due_date"] = _mongo_due_date(next_updates["due_date"])
    return get_tasks_collection().find_one_and_update(
        {"_id": _as_object_id(task_id)},
        {"$set": next_updates},
        return_document=ReturnDocument.AFTER,
    )


def delete_task(task_id):
    return get_tasks_collection().delete_one({"_id": _as_object_id(task_id)})
