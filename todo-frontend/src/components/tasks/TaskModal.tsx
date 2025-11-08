import { useEffect, useState } from "react";
import type {
    KanbanStatus,
    KanbanPriority,
    KanbanStatusMeta,
    KanbanPriorityMeta,
    KanbanTask,
} from "../../types/kanban";

interface TaskModalProps {
    open: boolean;
    mode: "create" | "edit";
    statuses: KanbanStatusMeta[];
    priorities: KanbanPriorityMeta[];
    initialTask?: KanbanTask | null;
    onClose: () => void;
    onSubmit: (payload: {
        id?: number;
        title: string;
        description: string;
        status: KanbanStatus;
        priority: KanbanPriority;
        due_date: string | null;
    }) => Promise<void> | void;
}

export function TaskModal({
    open,
    mode,
    statuses,
    priorities,
    initialTask,
    onClose,
    onSubmit,
}: TaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<KanbanStatus>("todo");
    const [priority, setPriority] = useState<KanbanPriority>("medium");
    const [dueDate, setDueDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setSubmitting(false);
            return;
        }
        if (mode === "edit" && initialTask) {
            setTitle(initialTask.title);
            setDescription(initialTask.description || "");
            setStatus(initialTask.status);
            setPriority(initialTask.priority);
            setDueDate(initialTask.due_date || "");
        } else {
            setTitle("");
            setDescription("");
            setStatus("todo");
            setPriority("medium");
            setDueDate("");
        }
        setSubmitting(false);
    }, [open, mode, initialTask]);

    useEffect(() => {
        if (!open) return;
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, submitting, onClose]);

    if (!open) return null;

    const handleSubmit = async () => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle || submitting) return;

        setSubmitting(true);

        const payload = {
            id: initialTask?.id,
            title: trimmedTitle,
            description: description.trim(),
            status,
            priority,
            due_date: dueDate || null,
        };

        try {
            await onSubmit(payload);
            if (mode === "create") {
                setTitle("");
                setDescription("");
                setStatus("todo");
                setPriority("medium");
                setDueDate("");
            }
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackdropClick = () => {
        if (!submitting) onClose();
    };

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
        >
            <div className="absolute inset-0" onClick={handleBackdropClick} />
            <div className="relative z-50 w-full max-w-2xl rounded-2xl border border-(--border-subtle) bg-(--surface-color) px-6 py-5 shadow-2xl">
                <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <span className="text-[0.7rem] uppercase tracking-wide text-(--muted)">
                            {mode === "create" ? "Neuer Task" : "Task bearbeiten"}
                        </span>
                        <h2
                            id="task-modal-title"
                            className="text-sm font-semibold text-(--fg-color)"
                        >
                            {mode === "create"
                                ? "Eintrag im Board anlegen"
                                : initialTask?.title || ""}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Dialog schließen"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-(--border-subtle) bg-transparent text-sm text-(--muted) hover:bg-(--surface-muted) hover:text-(--fg-color-strong) disabled:opacity-40"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-3 flex flex-col gap-2.5">
                    <input
                        autoFocus
                        value={title}
                        onChange={event => setTitle(event.target.value)}
                        placeholder="Titel"
                        className="w-full rounded-lg border border-(--border-subtle) bg-(--surface-muted) px-3 py-2 text-xs text-(--fg-color) placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-(--accent-strong)"
                    />
                    <textarea
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        placeholder="Beschreibung (optional)"
                        rows={3}
                        className="w-full resize-none rounded-lg border border-(--border-subtle) bg-(--surface-muted) px-3 py-2 text-[0.7rem] text-(--fg-color) placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-(--accent-strong)"
                    />
                    <div className="grid grid-cols-3 gap-2">
                        <select
                            value={status}
                            onChange={event =>
                                setStatus(event.target.value as KanbanStatus)
                            }
                            className="w-full rounded-lg border border-(--border-subtle) bg-(--surface-muted) px-2.5 py-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-2 focus:ring-(--accent-strong)"
                        >
                            {statuses.map(s => (
                                <option key={s.value} value={s.value}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={priority}
                            onChange={event =>
                                setPriority(event.target.value as KanbanPriority)
                            }
                            className="w-full rounded-lg border border-(--border-subtle) bg-(--surface-muted) px-2.5 py-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-2 focus:ring-(--accent-strong)"
                        >
                            {priorities.map(p => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={event => setDueDate(event.target.value)}
                            className="w-full rounded-lg border border-(--border-subtle) bg-(--surface-muted) px-2.5 py-2 text-[0.7rem] text-(--fg-color) focus:outline-none focus:ring-2 focus:ring-(--accent-strong)"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-lg border border-(--border-subtle) px-3 py-1.5 text-[0.7rem] text-(--muted) hover:bg-(--surface-muted) hover:text-(--fg-color-strong) disabled:opacity-50"
                    >
                        Abbrechen
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !title.trim()}
                        className="rounded-lg bg-(--accent) px-4 py-1.5 text-[0.7rem] font-semibold text-white hover:bg-(--accent-strong) disabled:opacity-40"
                    >
                        {mode === "create" ? "Erstellen" : "Speichern"}
                    </button>
                </div>
            </div>
        </div>
    );
}
