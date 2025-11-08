import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  KanbanMeta,
  KanbanTask,
  KanbanStatus,
  KanbanPriority,
  KanbanTheme,
} from "./types/kanban";
import {
  fetchBoardMeta,
  fetchTasks,
  fetchTrashedTasks,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  hardDeleteTask,
  bulkReorderTasks,
} from "./lib/api";
import { AppShell } from "./components/layout/AppShell";
import { BoardSidebar } from "./components/layout/BoardSidebar";
import { KanbanBoard } from "./components/kanban/KanbanBoard";
import { TaskModal } from "./components/tasks/TaskModal";
import { TrashBoard } from "./components/kanban/TrashBoard";

type StatusFilter = "all" | KanbanStatus;
type PriorityFilter = "all" | KanbanPriority;
type ViewMode = "board" | "trash";

/**
 * "system":
 *  - 07:00–18:59 -> light
 *  - sonst -> dark
 */
function getEffectiveTheme(mode: KanbanTheme): "light" | "dark" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

function App() {
  const [meta, setMeta] = useState<KanbanMeta | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);

  const [themeMode, setThemeMode] = useState<KanbanTheme>("system");
  const [viewMode, setViewMode] = useState<ViewMode>("board");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [ordering, setOrdering] = useState("status,order,-created_at");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // Theme aus LocalStorage laden
  useEffect(() => {
    const stored = window.localStorage.getItem("kanban-theme") as KanbanTheme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeMode(stored);
    }
  }, []);

  const effectiveTheme = useMemo(
    () => getEffectiveTheme(themeMode),
    [themeMode]
  );

  // CSS-Variable data-theme setzen
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  // Bei "system" alle 60s anhand Uhrzeit nachziehen
  useEffect(() => {
    if (themeMode !== "system") return;
    const id = window.setInterval(() => {
      const next = getEffectiveTheme("system");
      const current = document.documentElement.getAttribute("data-theme");
      if (current !== next) {
        document.documentElement.setAttribute("data-theme", next);
      }
    }, 60_000);
    return () => window.clearInterval(id);
  }, [themeMode]);

  const handleThemeToggle = () => {
    const next: KanbanTheme =
      themeMode === "light"
        ? "dark"
        : themeMode === "dark"
          ? "system"
          : "light";
    setThemeMode(next);
    window.localStorage.setItem("kanban-theme", next);
  };

  // Board-Metadaten laden
  const loadMeta = useCallback(async () => {
    try {
      const data = await fetchBoardMeta();
      setMeta(data);
    } catch {
      setError("Fehler beim Laden der Board-Konfiguration.");
    }
  }, []);

  // Tasks laden – abhängig von viewMode (Board vs. Trash)
  const loadTasks = useCallback(
    async (opts?: { keepLoading?: boolean }) => {
      if (!meta) return;
      if (!opts?.keepLoading) setLoading(true);
      setError("");

      try {
        if (viewMode === "board") {
          const data = await fetchTasks({
            search: search || undefined,
            status: statusFilter,
            priority: priorityFilter,
            ordering,
          });
          setTasks(data);
        } else {
          const data = await fetchTrashedTasks({
            search: search || undefined,
            priority: priorityFilter,
            ordering,
          });
          setTasks(data);
        }
      } catch {
        setError("Fehler beim Laden der Tasks.");
      } finally {
        setLoading(false);
      }
    },
    [meta, viewMode, search, statusFilter, priorityFilter, ordering]
  );

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!meta) return;
    loadTasks();
  }, [meta, loadTasks]);

  // Modal öffnen
  const openCreateModal = () => {
    if (viewMode !== "board") return; // im Papierkorb keine neuen Tasks
    setModalMode("create");
    setActiveTask(null);
    setModalOpen(true);
  };

  const openEditModal = (task: KanbanTask) => {
    if (viewMode !== "board") return; // detailliertes Edit nur im Board
    setModalMode("edit");
    setActiveTask(task);
    setModalOpen(true);
  };

  // Erstellen / Aktualisieren aus dem Modal
  const handleModalSubmit = async (payload: {
    id?: number;
    title: string;
    description: string;
    status: KanbanStatus;
    priority: KanbanPriority;
    due_date: string | null;
  }) => {
    if (viewMode !== "board") return;

    setError("");
    try {
      if (modalMode === "edit" && payload.id) {
        await updateTask(payload.id, {
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          due_date: payload.due_date,
        });
      } else {
        await createTask({
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
          due_date: payload.due_date,
        });
      }
      await loadTasks({ keepLoading: true });
    } catch {
      setError("Fehler beim Speichern des Tasks.");
    }
  };

  // Soft Delete -> in Papierkorb (nur im Board-Mode sichtbar)
  const handleSoftDeleteTask = async (id: number) => {
    setError("");
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError("Fehler beim Löschen des Tasks.");
      await loadTasks();
    }
  };

  // Wiederherstellen aus Papierkorb
  const handleRestoreTask = async (id: number) => {
    setError("");
    try {
      await restoreTask(id);
      await loadTasks({ keepLoading: true });
    } catch {
      setError("Fehler beim Wiederherstellen des Tasks.");
    }
  };

  // Endgültig löschen (nur Trash-Ansicht)
  const handleHardDeleteTask = async (id: number) => {
    setError("");
    try {
      await hardDeleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      setError("Fehler beim endgültigen Löschen des Tasks.");
      await loadTasks();
    }
  };

  // Drag & Drop Reordering (nur im Board-Mode sinnvoll)
  const handleMoveTask = async (
    id: number,
    status: KanbanStatus,
    index: number
  ) => {
    if (viewMode !== "board") return;

    const current = tasks;
    const moving = current.find(t => t.id === id);
    if (!moving) return;

    const others = current.filter(t => t.id !== id);
    const target = others
      .filter(t => t.status === status)
      .sort((a, b) => a.order - b.order || a.id - b.id);

    const targetIndex = Math.max(0, Math.min(index, target.length));
    const nextColumn = [...target];
    nextColumn.splice(targetIndex, 0, { ...moving, status });

    const updates = nextColumn.map((t, i) => ({
      id: t.id,
      status,
      order: i + 1,
    }));

    const nextTasks = [
      ...others.filter(t => t.status !== status),
      ...nextColumn.map((t, i) => ({
        ...t,
        status,
        order: i + 1,
      })),
    ];

    setTasks(nextTasks);

    try {
      await bulkReorderTasks(updates);
    } catch {
      await loadTasks();
    }
  };

  // Gefilterte Liste (Statusfilter nur im Board-Mode)
  const filteredTasks = tasks.filter(task => {
    if (viewMode === "board") {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }
    }
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !task.title.toLowerCase().includes(q) &&
        !(task.description || "").toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const sidebar = (
    <BoardSidebar
      theme={effectiveTheme}
      statuses={meta?.statuses || []}
      tasks={tasks}
      activeStatus={viewMode === "board" ? statusFilter : "all"}
      onStatusFilterChange={value =>
        setStatusFilter(value as StatusFilter)
      }
      viewMode={viewMode}
      onViewModeChange={mode => {
        setViewMode(mode);
        setStatusFilter("all");
        setPriorityFilter("all");
        setSearch("");
      }}
      trashCount={viewMode === "trash" ? tasks.length : undefined}
    />
  );

  // Header-Controls: einige nur im Board-Mode
  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="hidden md:flex gap-1.5">
        {viewMode === "board" && (
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className="h-8 rounded-xl border border-slate-300/70 bg-(--surface-muted) px-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-1 focus:ring-(--accent)"
          >
            <option value="all">Alle Status</option>
            {meta?.statuses.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        )}

        <select
          value={priorityFilter}
          onChange={e =>
            setPriorityFilter(e.target.value as PriorityFilter)
          }
          className="h-8 rounded-xl border border-slate-300/70 bg-(--surface-muted) px-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-1 focus:ring-(--accent)"
        >
          <option value="all">Alle Prioritäten</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {viewMode === "board" && (
          <select
            value={ordering}
            onChange={e => setOrdering(e.target.value)}
            className="h-8 rounded-xl border border-slate-300/70 bg-(--surface-muted) px-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-1 focus:ring-(--accent)"
          >
            <option value="status,order,-created_at">
              Spalte · Manuell
            </option>
            <option value="-created_at">Neueste zuerst</option>
            <option value="created_at">Älteste zuerst</option>
            <option value="priority">Priorität</option>
            <option value="title">Titel A–Z</option>
          </select>
        )}
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={
          viewMode === "board"
            ? "Tasks durchsuchen..."
            : "Papierkorb durchsuchen..."
        }
        className="hidden md:block h-8 w-44 rounded-xl border border-slate-300/70 bg-(--surface-muted) px-3 text-[0.7rem] text-(--fg-color) placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-(--accent)"
      />

      {viewMode === "board" && (
        <button
          type="button"
          onClick={openCreateModal}
          className="h-8 rounded-xl bg-(--accent) px-3 text-[0.7rem] font-semibold text-white hover:bg-(--accent-strong)"
        >
          New Task
        </button>
      )}
    </div>
  );

  return (
    <>
      <AppShell
        themeMode={themeMode}
        effectiveTheme={effectiveTheme}
        onToggleTheme={handleThemeToggle}
        sidebar={sidebar}
        headerActions={headerActions}
      >
        {error && (
          <div className="mb-2 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-1.5 text-[0.7rem] text-red-500">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-2 text-[0.7rem] text-slate-500">
            Laden...
          </div>
        )}

        {meta && viewMode === "board" && (
          <KanbanBoard
            tasks={filteredTasks}
            statuses={meta.statuses}
            theme={effectiveTheme}
            onMoveTask={handleMoveTask}
            onEditTask={openEditModal}
            onDeleteTask={handleSoftDeleteTask} // -> in Papierkorb
          />
        )}

        {meta && viewMode === "trash" && (
          <TrashBoard
            tasks={filteredTasks}
            theme={effectiveTheme}
            onRestoreTask={handleRestoreTask}
            onHardDeleteTask={handleHardDeleteTask}
          />
        )}
      </AppShell>

      {/* Task-Modal nur im Board-Mode */}
      {meta && viewMode === "board" && (
        <TaskModal
          open={modalOpen}
          mode={modalMode}
          statuses={meta.statuses}
          priorities={meta.priorities}
          initialTask={modalMode === "edit" ? activeTask : null}
          onClose={() => {
            setModalOpen(false);
            setActiveTask(null);
          }}
          onSubmit={handleModalSubmit}
        />
      )}
    </>
  );
}

export default App;
