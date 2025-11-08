import { useState } from "react";
import type { KanbanTask } from "../../types/kanban";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface TrashBoardProps {
    tasks: KanbanTask[];
    theme: "light" | "dark";
    onRestoreTask: (id: number) => void;
    onHardDeleteTask: (id: number) => void;
}

export function TrashBoard({
    tasks,
    theme,
    onRestoreTask,
    onHardDeleteTask,
}: TrashBoardProps) {
    const isDark = theme === "dark";
    const [deleteTarget, setDeleteTarget] = useState<KanbanTask | null>(null);

    const wrapper =
        "mt-4 rounded-2xl border px-3 py-3 transition-colors";
    const wrapperColor = isDark
        ? "bg-slate-950/95 border-slate-800"
        : "bg-white/95 border-slate-200";

    const cardBase =
        "flex flex-col gap-1.5 rounded-xl border px-3 py-2 text-[0.75rem] transition-all";
    const cardColor = isDark
        ? "bg-slate-950/95 border-slate-800 hover:border-red-400/70"
        : "bg-white border-slate-200 hover:border-red-400/70";
    const metaText =
        "text-[0.65rem] text-slate-500 flex items-center gap-1.5";

    return (
        <>
            <div className={`${wrapper} ${wrapperColor}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.65rem] uppercase tracking-wide text-(--muted)">
                            Papierkorb
                        </span>
                        <span className="text-xs text-(--muted)">
                            Gelöschte Tasks wiederherstellen oder endgültig entfernen.
                        </span>
                    </div>
                    <div className="text-[0.7rem] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-400/40">
                        {tasks.length} im Papierkorb
                    </div>
                </div>

                {tasks.length === 0 ? (
                    <div className="text-[0.75rem] text-(--muted)">
                        Kein Eintrag im Papierkorb. 🎉
                    </div>
                ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                className={`${cardBase} ${cardColor}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <div className="text-xs font-semibold text-(--fg-color)">
                                                {task.title}
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded-full text-[0.55rem] uppercase tracking-wide bg-slate-500/10 text-slate-500">
                                                {task.status}
                                            </span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded-full text-[0.55rem] uppercase tracking-wide ${task.priority === "critical"
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
                                            <div className="text-[0.7rem] text-slate-500 line-clamp-3">
                                                {task.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 items-end">
                                        <button
                                            type="button"
                                            onClick={() => onRestoreTask(task.id)}
                                            className="px-2 py-0.5 rounded-full border border-(--accent) text-[0.6rem] font-medium text-(--accent-strong) hover:bg-(--accent-soft)"
                                        >
                                            Wiederherstellen
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(task)}
                                            className="px-2 py-0.5 rounded-full border border-red-200 text-[0.6rem] font-medium text-red-500 hover:bg-red-50 hover:border-red-400"
                                        >
                                            Endgültig löschen
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-1 flex flex-wrap justify-between gap-2">
                                    <span className={metaText}>
                                        <span>Erstellt:</span>
                                        <span>
                                            {new Date(task.created_at).toLocaleDateString(
                                                "de-DE",
                                                { day: "2-digit", month: "2-digit" }
                                            )}
                                        </span>
                                    </span>
                                    {task.deleted_at && (
                                        <span className={metaText}>
                                            <span>Gelöscht:</span>
                                            <span className="text-red-400">
                                                {new Date(
                                                    task.deleted_at
                                                ).toLocaleDateString("de-DE", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                })}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Endgültig löschen?"
                description={
                    deleteTarget
                        ? `„${deleteTarget.title}“ wird dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`
                        : ""
                }
                confirmLabel="Ja, endgültig löschen"
                cancelLabel="Abbrechen"
                variant="danger"
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    onHardDeleteTask(deleteTarget.id);
                    setDeleteTarget(null);
                }}
            />
        </>
    );
}
