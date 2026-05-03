from bson import ObjectId
from rest_framework.exceptions import NotFound, PermissionDenied

from ..repositories.projects import get_project_by_id


def get_project_or_404(project_id):
    project = get_project_by_id(project_id)
    if not project:
        raise NotFound("Project not found.")
    return project


def ensure_project_member(user_id, project):
    is_member = ObjectId(user_id) in project["member_ids"]
    if not is_member:
        raise PermissionDenied("You do not have access to this project.")


def ensure_project_admin(user_id, project):
    if project["admin_id"] != ObjectId(user_id):
        raise PermissionDenied("Only project admins can perform this action.")
