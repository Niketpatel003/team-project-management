from pymongo import ASCENDING, MongoClient
from django.conf import settings

_client = None
_database = None
_indexes_ready = False


def get_client():
    global _client

    if _client is None:
        _client = MongoClient(settings.MONGODB_URI)

    return _client


def get_database():
    global _database

    if _database is None:
        _database = get_client()[settings.MONGODB_DB_NAME]

    return _database


def get_users_collection():
    ensure_indexes()
    return get_database()["users"]


def get_projects_collection():
    ensure_indexes()
    return get_database()["projects"]


def get_tasks_collection():
    ensure_indexes()
    return get_database()["tasks"]


def ensure_indexes():
    global _indexes_ready

    if _indexes_ready:
        return

    database = get_database()
    database["users"].create_index([("email", ASCENDING)], unique=True)
    database["projects"].create_index([("join_code", ASCENDING)], unique=True)
    database["projects"].create_index([("member_ids", ASCENDING)])
    database["tasks"].create_index([("project_id", ASCENDING)])
    database["tasks"].create_index([("assignee_id", ASCENDING)])
    database["tasks"].create_index([("status", ASCENDING)])

    _indexes_ready = True
