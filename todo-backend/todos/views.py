from django.db import models
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filterset_fields = ["key"]
    search_fields = ["name", "key", "description"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    filterset_fields = ["project", "status", "priority", "is_deleted"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "order", "priority", "title"]
    ordering = ["project", "status", "order", "-created_at"]

    def get_queryset(self):
        qs = Task.objects.select_related("project")

        # Papierkorb-spezifische Actions → nur gelöschte
        if self.action in {"trash", "restore", "hard_delete"}:
            return qs.filter(is_deleted=True)

        # Optionaler Filter über Query-Param
        is_deleted = self.request.query_params.get("is_deleted")
        if is_deleted == "true":
            return qs.filter(is_deleted=True)
        # Default: nur aktive
        return qs.filter(is_deleted=False)

    def create(self, request, *args, **kwargs):
        title = str(request.data.get("title", "")).strip()
        if not title:
            return Response(
                {"detail": "Title is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance: Task):
        """
        DELETE /api/tasks/:id/ → Soft Delete (Papierkorb)
        Wenn bereits is_deleted=True, dann wirklich löschen.
        """
        if not instance.is_deleted:
            instance.is_deleted = True
            instance.deleted_at = timezone.now()
            instance.save(update_fields=["is_deleted", "deleted_at"])
        else:
            instance.delete()

    @action(detail=False, methods=["post"])
    def bulk_reorder(self, request):
        """
        Erwartet: [{id, status, order}, ...]
        Nur nicht-gelöschte Tasks werden angepasst.
        """
        items = request.data if isinstance(request.data, list) else []
        updated = []

        for item in items:
            task_id = item.get("id")
            status_value = item.get("status")
            order_value = item.get("order")

            if not task_id or status_value not in dict(Task.Status.choices):
                continue

            try:
                task = Task.objects.get(id=task_id, is_deleted=False)
            except Task.DoesNotExist:
                continue

            fields = []
            if task.status != status_value:
                task.status = status_value
                fields.append("status")
            if isinstance(order_value, int) and task.order != order_value:
                task.order = order_value
                fields.append("order")

            if fields:
                task.save(update_fields=fields)
                updated.append(task.id)

        return Response({"updated": updated}, status=status.HTTP_200_OK)

    # 🔹 Papierkorb-Liste
    @action(detail=False, methods=["get"], url_path="trash")
    def trash(self, request):
        qs = Task.objects.select_related("project").filter(is_deleted=True)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 Restore einzelner Task aus Papierkorb
    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        task = self.get_object()  # kommt aus get_queryset → is_deleted=True
        task.is_deleted = False
        task.deleted_at = None

        # an sinnvolle Stelle einsortieren:
        current_max = (
            Task.objects.filter(
                project=task.project,
                status=task.status,
                is_deleted=False,
            )
            .aggregate(models.Max("order"))
            .get("order__max")
            or 0
        )
        task.order = current_max + 1

        task.save(update_fields=["is_deleted", "deleted_at", "order"])
        serializer = self.get_serializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # 🔹 Endgültig löschen (nur aus Papierkorb)
    @action(detail=True, methods=["delete"], url_path="hard-delete")
    def hard_delete(self, request, pk=None):
        task = self.get_object()  # nur is_deleted=True
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardMetaView(APIView):
    def get(self, request):
        statuses = [
            {"value": value, "label": label} for value, label in Task.Status.choices
        ]
        priorities = [
            {"value": value, "label": label} for value, label in Task.Priority.choices
        ]
        return Response(
            {
                "default_project_key": "BOARD",
                "statuses": statuses,
                "priorities": priorities,
            },
            status=status.HTTP_200_OK,
        )
