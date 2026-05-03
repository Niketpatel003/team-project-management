from django.urls import path

from api.views import (
    AddProjectMemberView,
    DashboardView,
    HealthCheckView,
    JoinProjectView,
    LoginView,
    MyTasksView,
    ProjectDetailView,
    ProjectListCreateView,
    ProjectTaskListCreateView,
    RemoveProjectMemberView,
    SignupView,
    TaskDetailView,
    TaskStatusUpdateView,
    UserProfileView,
)

urlpatterns = [
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/me/", UserProfileView.as_view(), name="me"),
    path("api/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("api/projects/", ProjectListCreateView.as_view(), name="project-list-create"),
    path("api/projects/join/", JoinProjectView.as_view(), name="project-join"),
    path("api/projects/<str:project_id>/", ProjectDetailView.as_view(), name="project-detail"),
    path(
        "api/projects/<str:project_id>/tasks/",
        ProjectTaskListCreateView.as_view(),
        name="project-task-list-create",
    ),
    path(
        "api/projects/<str:project_id>/members/",
        AddProjectMemberView.as_view(),
        name="project-add-member",
    ),
    path(
        "api/projects/<str:project_id>/members/<str:member_id>/",
        RemoveProjectMemberView.as_view(),
        name="project-remove-member",
    ),
    path("api/tasks/my-tasks/", MyTasksView.as_view(), name="my-tasks"),
    path("api/tasks/<str:task_id>/", TaskDetailView.as_view(), name="task-detail"),
    path(
        "api/tasks/<str:task_id>/status/",
        TaskStatusUpdateView.as_view(),
        name="task-status-update",
    ),
]
