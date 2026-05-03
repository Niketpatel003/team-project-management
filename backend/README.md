# SyncSphere Backend

This backend uses Django REST Framework with MongoDB for data storage. It provides authentication, project management, task management, and dashboard APIs for the SyncSphere frontend.

## Features

- Signup and login with hashed passwords
- JWT-based authentication
- Project creation and team membership
- Role-based access:
  - admins can manage members and all project tasks
  - members can view project data and update their assigned task status
- Dashboard metrics for task visibility and overdue work

## Planned API routes

- `POST /api/auth/signup/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`
- `GET /api/dashboard/`
- `GET /api/projects/`
- `POST /api/projects/`
- `POST /api/projects/join/`
- `GET /api/projects/:projectId/`
- `POST /api/projects/:projectId/`
- `POST /api/projects/:projectId/members/`
- `DELETE /api/projects/:projectId/members/:memberId/`
- `GET /api/tasks/my-tasks/`
- `PATCH /api/tasks/:taskId/`
- `DELETE /api/tasks/:taskId/`
- `PATCH /api/tasks/:taskId/status/`

## Environment variables

Copy `.env.example` into your own local environment and provide:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `DJANGO_SECRET_KEY`
- `JWT_SECRET_KEY`
- `CORS_ALLOWED_ORIGINS`

## Run locally

1. Create a virtual environment.
2. Install dependencies from `requirements.txt`.
3. Set environment variables from `.env.example`.
4. Start the server:

```bash
python manage.py runserver
```

## Seed demo data

After MongoDB is running, you can load demo accounts and sample project/task data with:

```bash
python manage.py seed_demo_data
```
