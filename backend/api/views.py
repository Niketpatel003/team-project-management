from datetime import datetime, timezone

from bson import ObjectId
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .repositories.projects import (
    add_member_to_project,
    create_project,
    get_project_by_join_code,
    list_projects_for_user,
    remove_member_from_project,
)
from .repositories.tasks import (
    create_task,
    delete_task,
    get_task_by_id,
    list_tasks_for_assignee,
    list_tasks_for_project,
    list_tasks_for_projects,
    update_task,
)
from .repositories.users import create_user, get_user_by_email, get_user_by_id, get_users_by_ids
from .serializers import (
    AddMemberSerializer,
    JoinProjectSerializer,
    LoginSerializer,
    ProjectCreateSerializer,
    SignupSerializer,
    TaskCreateUpdateSerializer,
    TaskStatusSerializer,
)
from .utils.jwt_tokens import create_access_token
from .utils.permissions import ensure_project_admin, ensure_project_member, get_project_or_404
from .utils.serializers import serialize_project, serialize_task, serialize_user


def _today():
    now = datetime.now(timezone.utc)
    return now.date()


def _date_value(value):
    if isinstance(value, datetime):
        return value.date()
    return value


def _normalize_project_bundle(project, users_by_id, tasks):
    return {
        **serialize_project(project),
        "members": [serialize_user(users_by_id[str(member_id)]) for member_id in project["member_ids"] if str(member_id) in users_by_id],
        "tasks": [serialize_task(task) for task in tasks],
    }


class PublicAPIView(APIView):
    permission_classes = [permissions.AllowAny]


class HealthCheckView(PublicAPIView):
    def get(self, request):
        return Response({"status": "ok", "service": "syncsphere-backend"})


class SignupView(PublicAPIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            user = create_user(
                name=payload["name"].strip(),
                email=payload["email"].strip().lower(),
                password_hash=make_password(payload["password"]),
            )
        except ValueError as error:
            raise ValidationError({"email": str(error)}) from error
        token = create_access_token(user["_id"])

        return Response(
            {"token": token, "user": serialize_user(user)},
            status=status.HTTP_201_CREATED,
        )


class LoginView(PublicAPIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        user = get_user_by_email(payload["email"].strip().lower())
        if not user or not check_password(payload["password"], user["password_hash"]):
            raise ValidationError({"detail": "Invalid email or password."})

        token = create_access_token(user["_id"])
        return Response({"token": token, "user": serialize_user(user)})


class UserProfileView(APIView):
    def get(self, request):
        user = get_user_by_id(request.user.id)
        if not user:
            raise NotFound("User not found.")
        return Response({"user": serialize_user(user)})


class DashboardView(APIView):
    def get(self, request):
        projects = list_projects_for_user(request.user.id)
        project_ids = [project["_id"] for project in projects]
        tasks = list_tasks_for_projects(project_ids) if project_ids else []
        users = get_users_by_ids(
            {
                str(member_id)
                for project in projects
                for member_id in project["member_ids"]
            }
        ) if projects else []

        tasks_by_status = {
            "todo": sum(task["status"] == "todo" for task in tasks),
            "in-progress": sum(task["status"] == "in-progress" for task in tasks),
            "done": sum(task["status"] == "done" for task in tasks),
        }

        overdue_tasks = [
            serialize_task(task)
            for task in tasks
            if _date_value(task["due_date"]) < _today() and task["status"] != "done"
        ]

        tasks_per_user = []
        for user in users:
            user_tasks = [task for task in tasks if task.get("assignee_id") == user["_id"]]
            completed = sum(task["status"] == "done" for task in user_tasks)
            tasks_per_user.append(
                {
                    **serialize_user(user),
                    "total_tasks": len(user_tasks),
                    "completed_tasks": completed,
                    "active_tasks": len(user_tasks) - completed,
                }
            )

        assigned_tasks = [task for task in tasks if task.get("assignee_id") == ObjectId(request.user.id)]

        return Response(
            {
                "total_tasks": len(tasks),
                "tasks_by_status": tasks_by_status,
                "tasks_per_user": tasks_per_user,
                "overdue_tasks": overdue_tasks,
                "assigned_tasks_count": len(assigned_tasks),
                "project_count": len(projects),
            }
        )


class ProjectListCreateView(APIView):
    def get(self, request):
        projects = list_projects_for_user(request.user.id)
        project_ids = [project["_id"] for project in projects]
        tasks = list_tasks_for_projects(project_ids) if project_ids else []
        tasks_by_project = {}
        for task in tasks:
            tasks_by_project.setdefault(str(task["project_id"]), []).append(task)

        users = get_users_by_ids(
            {
                str(member_id)
                for project in projects
                for member_id in project["member_ids"]
            }
        ) if projects else []
        users_by_id = {user["id"]: user for user in [serialize_user(user) for user in users]}

        response_projects = []
        for project in projects:
            project_tasks = tasks_by_project.get(str(project["_id"]), [])
            response_projects.append(
                {
                    **serialize_project(project),
                    "members": [
                        users_by_id[str(member_id)]
                        for member_id in project["member_ids"]
                        if str(member_id) in users_by_id
                    ],
                    "task_count": len(project_tasks),
                    "done_count": sum(task["status"] == "done" for task in project_tasks),
                    "overdue_count": sum(
                        _date_value(task["due_date"]) < _today() and task["status"] != "done"
                        for task in project_tasks
                    ),
                    "is_admin": project["admin_id"] == ObjectId(request.user.id),
                }
            )

        return Response({"projects": response_projects})

    def post(self, request):
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        project = create_project(
            name=payload["name"].strip(),
            description=payload["description"].strip(),
            color=payload["color"],
            admin_id=request.user.id,
        )
        return Response({"project": serialize_project(project)}, status=status.HTTP_201_CREATED)


class JoinProjectView(APIView):
    def post(self, request):
        serializer = JoinProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_code = serializer.validated_data["join_code"].strip().upper()

        project = get_project_by_join_code(join_code)
        if not project:
            raise NotFound("That project code does not exist.")

        if ObjectId(request.user.id) in project["member_ids"]:
            raise ValidationError({"detail": "You already belong to that project."})

        updated_project = add_member_to_project(project_id=project["_id"], member_id=request.user.id)
        return Response({"project": serialize_project(updated_project)})


class ProjectDetailView(APIView):
    def get(self, request, project_id):
        project = get_project_or_404(project_id)
        ensure_project_member(request.user.id, project)

        tasks = list_tasks_for_project(project_id)
        members = get_users_by_ids(str(member_id) for member_id in project["member_ids"])
        users_by_id = {str(user["_id"]): user for user in members}

        response_project = _normalize_project_bundle(project, users_by_id, tasks)
        response_project["is_admin"] = project["admin_id"] == ObjectId(request.user.id)
        response_project["summary"] = {
            "todo": sum(task["status"] == "todo" for task in tasks),
            "in_progress": sum(task["status"] == "in-progress" for task in tasks),
            "done": sum(task["status"] == "done" for task in tasks),
            "member_count": len(project["member_ids"]),
            "task_count": len(tasks),
        }

        return Response({"project": response_project})


class ProjectTaskListCreateView(APIView):
    def get(self, request, project_id):
        project = get_project_or_404(project_id)
        ensure_project_member(request.user.id, project)

        tasks = list_tasks_for_project(project_id)
        return Response({"tasks": [serialize_task(task) for task in tasks]})

    def post(self, request, project_id):
        project = get_project_or_404(project_id)
        ensure_project_admin(request.user.id, project)

        serializer = TaskCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        assignee_id = payload.get("assignee_id")
        if assignee_id and ObjectId(assignee_id) not in project["member_ids"]:
            raise ValidationError({"assignee_id": "Assignee must be a project member."})

        task = create_task(
            project_id=project_id,
            creator_id=request.user.id,
            title=payload["title"].strip(),
            description=payload["description"].strip(),
            due_date=payload["due_date"],
            priority=payload["priority"],
            status=payload["status"],
            assignee_id=assignee_id,
        )
        return Response({"task": serialize_task(task)}, status=status.HTTP_201_CREATED)


class AddProjectMemberView(APIView):
    def post(self, request, project_id):
        project = get_project_or_404(project_id)
        ensure_project_admin(request.user.id, project)

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()

        user = get_user_by_email(email)
        if not user:
            raise NotFound("No user exists with that email.")

        if user["_id"] in project["member_ids"]:
            raise ValidationError({"detail": "That user is already in the project."})

        add_member_to_project(project_id=project_id, member_id=user["_id"])
        return Response({"member": serialize_user(user)})


class RemoveProjectMemberView(APIView):
    def delete(self, request, project_id, member_id):
        project = get_project_or_404(project_id)
        ensure_project_admin(request.user.id, project)

        if project["admin_id"] == ObjectId(member_id):
            raise ValidationError({"detail": "The project admin cannot be removed."})

        if ObjectId(member_id) not in project["member_ids"]:
            raise NotFound("That user is not in the project.")

        remove_member_from_project(project_id=project_id, member_id=member_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskDetailView(APIView):
    def patch(self, request, task_id):
        task = get_task_by_id(task_id)
        if not task:
            raise NotFound("Task not found.")

        project = get_project_or_404(task["project_id"])
        ensure_project_admin(request.user.id, project)

        serializer = TaskCreateUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        if "assignee_id" in payload and payload["assignee_id"]:
            if ObjectId(payload["assignee_id"]) not in project["member_ids"]:
                raise ValidationError({"assignee_id": "Assignee must be a project member."})

        updated_task = update_task(task_id, payload)
        return Response({"task": serialize_task(updated_task)})

    def delete(self, request, task_id):
        task = get_task_by_id(task_id)
        if not task:
            raise NotFound("Task not found.")

        project = get_project_or_404(task["project_id"])
        ensure_project_admin(request.user.id, project)

        delete_task(task_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskStatusUpdateView(APIView):
    def patch(self, request, task_id):
        task = get_task_by_id(task_id)
        if not task:
            raise NotFound("Task not found.")

        project = get_project_or_404(task["project_id"])
        ensure_project_member(request.user.id, project)

        is_admin = project["admin_id"] == ObjectId(request.user.id)
        is_assignee = task.get("assignee_id") == ObjectId(request.user.id)
        if not is_admin and not is_assignee:
            raise PermissionDenied("You do not have permission to update this task.")

        serializer = TaskStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_task = update_task(task_id, {"status": serializer.validated_data["status"]})
        return Response({"task": serialize_task(updated_task)})


class MyTasksView(APIView):
    def get(self, request):
        tasks = list_tasks_for_assignee(request.user.id)
        visible_tasks = []
        for task in tasks:
            project = get_project_or_404(task["project_id"])
            ensure_project_member(request.user.id, project)
            visible_tasks.append(
                {
                    **serialize_task(task),
                    "project_name": project["name"],
                }
            )

        return Response({"tasks": visible_tasks})
