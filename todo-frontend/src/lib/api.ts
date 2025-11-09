import axios from "axios";
import type {
  KanbanMeta,
  KanbanTask,
  KanbanStatus,
  KanbanPriority,
  KanbanTaskCreate,
  KanbanTaskUpdate,
  KanbanTaskReorder,
} from "../types/kanban";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  timeout: 10000,
});

function unwrapList<T>(data: unknown): T[] {
  const anyData = data as any;
  if (Array.isArray(anyData)) return anyData as T[];
  if (anyData && Array.isArray(anyData.results)) return anyData.results as T[];
  return [];
}

export async function fetchBoardMeta(): Promise<KanbanMeta> {
  const res = await api.get<KanbanMeta>("/board/");
  return res.data;
}

export async function fetchTasks(params: {
  search?: string;
  status?: KanbanStatus | "all";
  priority?: KanbanPriority | "all";
  ordering?: string;
}): Promise<KanbanTask[]> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.priority && params.priority !== "all") query.priority = params.priority;
  if (params.ordering) query.ordering = params.ordering;
  const res = await api.get("/tasks/", { params: query });
  return unwrapList<KanbanTask>(res.data);
}

export async function fetchTrashedTasks(params: {
  search?: string;
  priority?: KanbanPriority | "all";
  ordering?: string;
} = {}): Promise<KanbanTask[]> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.priority && params.priority !== "all") {
    query.priority = params.priority;
  }
  if (params.ordering) query.ordering = params.ordering;

  const res = await api.get("/tasks/trash/", { params: query });
  return unwrapList<KanbanTask>(res.data);
}

export async function createTask(payload: KanbanTaskCreate): Promise<KanbanTask> {
  const res = await api.post<KanbanTask>("/tasks/", payload);
  return res.data;
}

export async function updateTask(id: number, payload: KanbanTaskUpdate): Promise<KanbanTask> {
  const res = await api.patch<KanbanTask>(`/tasks/${id}/`, payload);
  return res.data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}/`);
}

export async function restoreTask(id: number): Promise<KanbanTask> {
  const res = await api.post<KanbanTask>(`/tasks/${id}/restore/`);
  return res.data;
}

export async function hardDeleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}/hard-delete/`);
}

export async function bulkReorderTasks(updates: KanbanTaskReorder[]): Promise<void> {
  if (!updates.length) return;
  await api.post("/tasks/bulk_reorder/", updates);
}
