from django.db import models
from rest_framework import serializers
from .models import Project, Task


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "key",
            "description",
            "created_at",
            "updated_at",
        ]


class TaskSerializer(serializers.ModelSerializer):
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = [
            "id",
            "project",
            "title",
            "description",
            "status",
            "priority",
            "order",
            "due_date",
            "created_at",
            "updated_at",
            "is_deleted",  # 🔹 neu
            "deleted_at",  # 🔹 neu
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
        ]

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        return value

    def get_default_project(self) -> Project:
        project, _ = Project.objects.get_or_create(
            key="BOARD",
            defaults={"name": "Board", "description": ""},
        )
        return project

    def create(self, validated_data):
        project = validated_data.get("project") or self.get_default_project()
        validated_data["project"] = project

        status_value = validated_data.get("status", Task.Status.TODO)
        current_max = (
            Task.objects.filter(project=project, status=status_value, is_deleted=False)
            .aggregate(models.Max("order"))
            .get("order__max")
            or 0
        )
        validated_data.setdefault("order", current_max + 1)
        return super().create(validated_data)
