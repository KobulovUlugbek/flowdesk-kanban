import { useState } from "react";
import type {
    KanbanTask,
    KanbanStatus,
    KanbanStatusMeta,
} from "../../types/kanban";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface KanbanBoardProps {
    tasks: KanbanTask[];
    statuses: KanbanStatusMeta[];
    theme: "light" | "dark";
    onMoveTask: (id: number, status: KanbanStatus, index: number) => void;
    onEditTask: (task: KanbanTask) => void;
    onDeleteTask: (id: number) => void;
}

type DragState =
    | { taskId: number; status: KanbanStatus; index: number }
    | null;

export function KanbanBoard({
    tasks,
    statuses,
    theme,
    onMoveTask,
    onEditTask,
    onDeleteTask,
}: KanbanBoardProps) {
    const [dragState, setDragState] = useState<DragState>(null);
    const [deleteTarget, setDeleteTarget] = useState<KanbanTask | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const isDark = theme === "dark";

    const colBase =
        "flex flex-col gap-2 rounded-2xl border px-3 py-2.5 min-h-[160px] transition-colors transition-shadow";
    const colColor = isDark
        ? "bg-slate-950/95 border-slate-800 hover:border-slate-600/80"
        : "bg-white/95 border-slate-200 hover:border-slate-300";
    const colActive =
        "ring-1 ring-(--accent) ring-offset-1 ring-offset-(--bg-color)";

    const cardBase =
        "group flex flex-col gap-1.5 rounded-xl border px-3 py-2 cursor-grab active:cursor-grabbing transition-all";
    const cardColor = isDark
        ? "bg-slate-950/95 border-slate-800 hover:border-(--accent) hover:bg-slate-900/95 shadow-sm"
        : "bg-white border-slate-200 hover:border-(--accent) hover:bg-slate-50 shadow-sm";

    const metaText = "text-[0.7rem] leading-none text-slate-500";
    const columnLabel = isDark ? "text-slate-100" : "text-slate-700";

    const getColumnTasks = (status: KanbanStatus) =>
        tasks
            .filter(task => task.status === status)
            .sort((a, b) => a.order - b.order || a.id - b.id);

    const handleDropColumn = (status: KanbanStatus) => {
        if (!dragState) return;
        const columnTasks = getColumnTasks(status);
        onMoveTask(dragState.taskId, status, columnTasks.length);
        setDragState(null);
        setIsDragging(false);
    };

    const handleDropAt = (status: KanbanStatus, index: number) => {
        if (!dragState) return;
        onMoveTask(dragState.taskId, status, index);
        setDragState(null);
        setIsDragging(false);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        onDeleteTask(deleteTarget.id);
        setDeleteTarget(null);
    };

    return (
        <>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
                {statuses.map(column => {
                    const status = column.value as KanbanStatus;
                    const columnTasks = getColumnTasks(status);
                    const isActiveColumn =
                        !!dragState && dragState.status === status;

                    return (
                        <div
                            key={status}
                            role="region"
                            aria-label={column.label}
                            className={`${colBase} ${colColor} ${isActiveColumn ? colActive : ""
                                }`}
                            onDragOver={event => {
                                event.preventDefault();
                                if (dragState) {
                                    setDragState(prev =>
                                        prev
                                            ? {
                                                ...prev,
                                                status,
                                                index: columnTasks.length,
                                            }
                                            : prev
                                    );
                                }
                            }}
                            onDrop={event => {
                                event.preventDefault();
                                if (!dragState) return;
                                handleDropColumn(status);
                            }}
                        >
                            {/* Spaltenkopf */}
                            <div className="mb-1 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
                                    <div
                                        className={`text-[0.7rem] font-semibold uppercase tracking-wide ${columnLabel}`}
                                    >
                                        {column.label}
                                    </div>
                                </div>
                                <div
                                    className={`rounded-full px-2 py-0.5 text-[0.7rem] ${isDark
                                            ? "bg-slate-800/40 text-slate-300"
                                            : "bg-slate-100 text-slate-500"
                                        }`}
                                >
                                    {columnTasks.length}
                                </div>
                            </div>

                            {/* Karten & Drop-Zonen */}
                            <div className="flex flex-col gap-1.5">
                                {columnTasks.length === 0 && !dragState && (
                                    <div className="text-[0.7rem] text-slate-500">
                                        Task hier ablegen
                                    </div>
                                )}

                                {columnTasks.map((task, index) => {
                                    const isCardDragging =
                                        !!dragState && dragState.taskId === task.id;
                                    const showBefore =
                                        !!dragState &&
                                        dragState.taskId !== task.id &&
                                        dragState.status === status &&
                                        dragState.index === index;

                                    return (
                                        <div
                                            key={task.id}
                                            className="flex flex-col gap-0.5"
                                        >
                                            {/* Ghost-Slot vor Karte */}
                                            {showBefore && (
                                                <div className="h-9 rounded-xl border-2 border-dashed border-(--accent-soft) bg-(--surface-muted) flex items-center justify-center text-[0.65rem] text-(--accent-strong) transition-all duration-150">
                                                    Hier ablegen
                                                </div>
                                            )}

                                            {/* Karte */}
                                            <div
                                                draggable
                                                onClick={() => {
                                                    if (!isDragging) {
                                                        onEditTask(task);
                                                    }
                                                }}
                                                onDragStart={event => {
                                                    event.dataTransfer.setData(
                                                        "text/plain",
                                                        String(task.id)
                                                    );
                                                    setIsDragging(true);
                                                    setDragState({
                                                        taskId: task.id,
                                                        status,
                                                        index,
                                                    });
                                                }}
                                                onDragOver={event => {
                                                    event.preventDefault();
                                                    if (!dragState || dragState.taskId === task.id)
                                                        return;
                                                    setDragState({
                                                        taskId: dragState.taskId,
                                                        status,
                                                        index,
                                                    });
                                                }}
                                                onDragEnd={() => {
                                                    setIsDragging(false);
                                                    setDragState(null);
                                                }}
                                                onDrop={event => {
                                                    event.preventDefault();
                                                    if (!dragState) return;
                                                    handleDropAt(status, index);
                                                }}
                                                className={`${cardBase} ${cardColor} ${isCardDragging
                                                        ? "opacity-60 ring-1 ring-(--accent) shadow-lg scale-[1.02]"
                                                        : "transition-all duration-150"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-1.5">
                                                    {/* Inhalt */}
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="text-xs font-semibold leading-snug text-(--fg-color)">
                                                                {task.title}
                                                            </div>
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded-full text-[0.6rem] uppercase tracking-wide ${task.priority === "critical"
                                                                        ? "badge-danger"
                                                                        : task.priority === "high"
                                                                            ? "bg-orange-500/10 text-orange-500"
                                                                            : task.priority === "medium"
                                                                                ? "bg-sky-500/10 text-sky-500"
                                                                                : "bg-slate-500/10 text-slate-500"
                                                                    }`}
                                                            >
                                                                {task.priority}
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <div className="text-[0.7rem] text-slate-500 leading-snug line-clamp-3">
                                                                {task.description}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Actions (Hover) */}
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onEditTask(task);
                                                            }}
                                                            className="px-2 py-0.5 rounded-full border border-(--accent) text-[0.6rem] font-medium text-(--accent-strong) bg-transparent hover:bg-(--accent-soft)"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setDeleteTarget(task);
                                                            }}
                                                            className="px-2 py-0.5 rounded-full border border-red-200 text-[0.6rem] font-medium text-red-500 hover:bg-red-50 hover:border-red-400"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Meta: nur Datum */}
                                                <div className="mt-1 flex items-center justify-end">
                                                    <span className={metaText}>
                                                        {task.due_date
                                                            ? task.due_date
                                                            : new Date(
                                                                task.created_at
                                                            ).toLocaleDateString("de-DE", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                            })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Ghost-Slot am Spaltenende */}
                                {dragState &&
                                    dragState.status === status &&
                                    dragState.index === columnTasks.length && (
                                        <div className="mt-0.5 h-9 rounded-xl border-2 border-dashed border-(--accent-soft) bg-(--surface-muted) flex items-center justify-center text-[0.65rem] text-(--accent-strong) transition-all duration-150">
                                            Hier am Ende ablegen
                                        </div>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delete-Confirm Modal */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Task löschen?"
                description={
                    deleteTarget
                        ? `„${deleteTarget.title}“ wird dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`
                        : ""
                }
                confirmLabel="Ja, löschen"
                cancelLabel="Abbrechen"
                variant="danger"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </>
    );
}
