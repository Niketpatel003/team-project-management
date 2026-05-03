# SyncSphere

SyncSphere is a team task management web application with a React frontend and a Django + MongoDB backend. The frontend is already built, and the backend API scaffold is now included in this repository.

## What is included

- React frontend with:
  - user authentication UI
  - protected routes
  - dashboard analytics
  - project creation and joining
  - task board and task management
  - role-aware admin/member flows
- Django backend with:
  - JWT authentication
  - MongoDB integration
  - project, member, task, and dashboard APIs
  - seed command for demo data

## Demo accounts

- `aarav@syncsphere.app` / `password123`
- `maya@syncsphere.app` / `password123`

## Frontend run locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open the local Vite URL in your browser.

Frontend environment:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Backend run locally

1. Create and activate a Python virtual environment inside `backend`.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment variables from `backend/.env.example`.
4. Start the API:

```bash
python manage.py runserver
```

5. Optional demo seed:

```bash
python manage.py seed_demo_data
```

Recommended local full-stack flow:

1. Start MongoDB
2. Run the Django backend from `backend`
3. Seed demo data with `python manage.py seed_demo_data`
4. Run the React frontend from the repo root

## Tech stack

- Frontend: React, Vite, React Router
- Backend: Django REST Framework, PyMongo, JWT
- Database: MongoDB

## Project structure

```text
backend/
src/
```

## Next milestone

The remaining major milestone is deployment on Railway, plus the final submission items like the public URL, GitHub repository, and demo video.
