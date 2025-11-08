export type KanbanTheme = "system" | "dark" | "light";

export type KanbanStatus = "todo" | "in_progress" | "in_review" | "done";

export type KanbanPriority = "low" | "medium" | "high" | "critical";

export interface KanbanStatusMeta {
  value: KanbanStatus;
  label: string;
}

export interface KanbanPriorityMeta {
  value: KanbanPriority;
  label: string;
}

export interface KanbanMeta {
  default_project_key: string;
  statuses: KanbanStatusMeta[];
  priorities: KanbanPriorityMeta[];
}

export interface KanbanTask {
  id: number;
  project: number;
  title: string;
  description: string;
  status: KanbanStatus;
  priority: KanbanPriority;
  order: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
}


export interface KanbanTaskCreate {
  title: string;
  description?: string;
  status?: KanbanStatus;
  priority?: KanbanPriority;
  due_date?: string | null;
}

export interface KanbanTaskUpdate {
  title?: string;
  description?: string;
  status?: KanbanStatus;
  priority?: KanbanPriority;
  order?: number;
  due_date?: string | null;
}

export interface KanbanTaskReorder {
  id: number;
  status: KanbanStatus;
  order: number;
}

