from datetime import date, datetime, timezone


def _iso(value):
    if value is None:
        return None

    if isinstance(value, date) and not isinstance(value, datetime):
        return datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc).isoformat()

    return value.isoformat()


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": _iso(user.get("created_at")),
    }


def serialize_project(project):
    return {
        "id": str(project["_id"]),
        "name": project["name"],
        "description": project["description"],
        "color": project["color"],
        "admin_id": str(project["admin_id"]),
        "member_ids": [str(member_id) for member_id in project["member_ids"]],
        "join_code": project["join_code"],
        "created_at": _iso(project.get("created_at")),
        "updated_at": _iso(project.get("updated_at")),
    }


def serialize_task(task):
    return {
        "id": str(task["_id"]),
        "project_id": str(task["project_id"]),
        "creator_id": str(task["creator_id"]),
        "title": task["title"],
        "description": task["description"],
        "due_date": _iso(task["due_date"]),
        "priority": task["priority"],
        "status": task["status"],
        "assignee_id": str(task["assignee_id"]) if task.get("assignee_id") else None,
        "created_at": _iso(task.get("created_at")),
        "updated_at": _iso(task.get("updated_at")),
    }
