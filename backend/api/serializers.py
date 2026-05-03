from bson import ObjectId
from rest_framework import serializers


TASK_STATUS_CHOICES = ("todo", "in-progress", "done")
TASK_PRIORITY_CHOICES = ("low", "medium", "high", "critical")
PROJECT_COLOR_CHOICES = ("sunset", "lagoon", "mango")


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProjectCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=180)
    description = serializers.CharField(max_length=2000)
    color = serializers.ChoiceField(choices=PROJECT_COLOR_CHOICES)


class JoinProjectSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=12)


class AddMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()


class TaskCreateUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    description = serializers.CharField(max_length=2000)
    due_date = serializers.DateField()
    priority = serializers.ChoiceField(choices=TASK_PRIORITY_CHOICES)
    status = serializers.ChoiceField(choices=TASK_STATUS_CHOICES)
    assignee_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_assignee_id(self, value):
        if not value:
            return None

        try:
            ObjectId(value)
        except Exception as error:
            raise serializers.ValidationError("Invalid assignee id.") from error

        return value


class TaskStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=TASK_STATUS_CHOICES)
