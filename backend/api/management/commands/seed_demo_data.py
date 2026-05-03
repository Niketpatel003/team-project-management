from datetime import date, datetime, time, timedelta, timezone

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from api.db import get_projects_collection, get_tasks_collection, get_users_collection
from api.repositories.users import get_user_by_email


class Command(BaseCommand):
    help = "Seed demo users, projects, and tasks for SyncSphere."

    def handle(self, *args, **options):
        users_collection = get_users_collection()
        projects_collection = get_projects_collection()
        tasks_collection = get_tasks_collection()
        now = datetime.now(timezone.utc)

        user_specs = [
            ("Aarav Mehta", "aarav@syncsphere.app"),
            ("Maya Nair", "maya@syncsphere.app"),
            ("Ishan Verma", "ishan@syncsphere.app"),
            ("Sara Khan", "sara@syncsphere.app"),
        ]

        user_ids = {}
        for name, email in user_specs:
            user = get_user_by_email(email)
            if not user:
                result = users_collection.insert_one(
                    {
                        "name": name,
                        "email": email,
                        "password_hash": make_password("password123"),
                        "created_at": now,
                        "updated_at": now,
                    }
                )
                user = users_collection.find_one({"_id": result.inserted_id})
                self.stdout.write(self.style.SUCCESS(f"Created user {email}"))
            else:
                if "created_at" not in user or "updated_at" not in user:
                    users_collection.update_one(
                        {"_id": user["_id"]},
                        {"$set": {"created_at": user.get("created_at", now), "updated_at": now}},
                    )
                    user = users_collection.find_one({"_id": user["_id"]})
                self.stdout.write(f"User already exists: {email}")

            user_ids[email] = user["_id"]

        project_specs = [
            {
                "name": "Product Launch Sprint",
                "description": "Coordinate launch content, design reviews, onboarding tasks, and release checks.",
                "color": "sunset",
                "join_code": "LAUNCH6",
                "admin_email": "aarav@syncsphere.app",
                "member_emails": ["aarav@syncsphere.app", "maya@syncsphere.app", "ishan@syncsphere.app"],
            },
            {
                "name": "Campus Placement Portal",
                "description": "Build the internal portal used by students, coordinators, and recruiters.",
                "color": "lagoon",
                "join_code": "PORTAL9",
                "admin_email": "sara@syncsphere.app",
                "member_emails": ["sara@syncsphere.app", "aarav@syncsphere.app", "maya@syncsphere.app"],
            },
        ]

        project_ids = {}
        for spec in project_specs:
            project = projects_collection.find_one({"join_code": spec["join_code"]})
            if not project:
                result = projects_collection.insert_one(
                    {
                        "name": spec["name"],
                        "description": spec["description"],
                        "color": spec["color"],
                        "join_code": spec["join_code"],
                        "admin_id": user_ids[spec["admin_email"]],
                        "member_ids": [user_ids[email] for email in spec["member_emails"]],
                        "created_at": now,
                        "updated_at": now,
                    }
                )
                project = projects_collection.find_one({"_id": result.inserted_id})
                self.stdout.write(self.style.SUCCESS(f"Created project {spec['name']}"))
            else:
                if "created_at" not in project or "updated_at" not in project:
                    projects_collection.update_one(
                        {"_id": project["_id"]},
                        {"$set": {"created_at": project.get("created_at", now), "updated_at": now}},
                    )
                    project = projects_collection.find_one({"_id": project["_id"]})
                self.stdout.write(f"Project already exists: {spec['name']}")

            project_ids[spec["join_code"]] = project["_id"]

        today = date.today()
        task_specs = [
            {
                "project_join_code": "LAUNCH6",
                "title": "Finalize release notes",
                "description": "Draft release notes and align them with launch copy.",
                "due_date": today + timedelta(days=2),
                "priority": "high",
                "status": "in-progress",
                "assignee_email": "maya@syncsphere.app",
                "creator_email": "aarav@syncsphere.app",
            },
            {
                "project_join_code": "LAUNCH6",
                "title": "QA smoke test checklist",
                "description": "Validate the launch checklist and regression coverage.",
                "due_date": today + timedelta(days=1),
                "priority": "critical",
                "status": "todo",
                "assignee_email": "ishan@syncsphere.app",
                "creator_email": "aarav@syncsphere.app",
            },
            {
                "project_join_code": "PORTAL9",
                "title": "Recruiter CSV import validation",
                "description": "Add validations for duplicate recruiter records in upload flow.",
                "due_date": today + timedelta(days=5),
                "priority": "high",
                "status": "in-progress",
                "assignee_email": "maya@syncsphere.app",
                "creator_email": "sara@syncsphere.app",
            },
        ]

        for spec in task_specs:
            existing_task = tasks_collection.find_one(
                {
                    "project_id": project_ids[spec["project_join_code"]],
                    "title": spec["title"],
                }
            )
            if existing_task:
                if "created_at" not in existing_task or "updated_at" not in existing_task:
                    tasks_collection.update_one(
                        {"_id": existing_task["_id"]},
                        {"$set": {"created_at": existing_task.get("created_at", now), "updated_at": now}},
                    )
                self.stdout.write(f"Task already exists: {spec['title']}")
                continue

            tasks_collection.insert_one(
                {
                    "project_id": project_ids[spec["project_join_code"]],
                    "creator_id": user_ids[spec["creator_email"]],
                    "title": spec["title"],
                    "description": spec["description"],
                    "due_date": datetime.combine(spec["due_date"], time.min, tzinfo=timezone.utc),
                    "priority": spec["priority"],
                    "status": spec["status"],
                    "assignee_id": user_ids[spec["assignee_email"]],
                    "created_at": now,
                    "updated_at": now,
                }
            )
            self.stdout.write(self.style.SUCCESS(f"Created task {spec['title']}"))

        self.stdout.write(self.style.SUCCESS("Demo data seed complete."))
