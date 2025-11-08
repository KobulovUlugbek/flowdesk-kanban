import type {
    KanbanTask,
    KanbanStatusMeta,
} from "../../types/kanban";

interface BoardSidebarProps {
    theme: "light" | "dark";
    statuses: KanbanStatusMeta[];
    tasks: KanbanTask[];
    activeStatus: string;
    onStatusFilterChange: (value: string) => void;
    viewMode: "board" | "trash";
    onViewModeChange: (mode: "board" | "trash") => void;
    trashCount?: number;
}

export function BoardSidebar({
    theme,
    statuses,
    tasks,
    activeStatus,
    onStatusFilterChange,
    viewMode,
    onViewModeChange,
    trashCount,
}: BoardSidebarProps) {
    const isDark = theme === "dark";
    const isTrash = viewMode === "trash";
    const effectiveActiveStatus = isTrash ? "all" : activeStatus;

    const chipBase =
        "flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-[0.7rem] cursor-pointer select-none transition-all";
    const chipActive = isDark
        ? "bg-(--accent-soft) border border-(--accent) text-(--accent)"
        : "bg-(--accent-soft) border border-(--accent) text-(--accent-strong)";
    const chipInactive = isDark
        ? "bg-slate-950/40 border border-slate-800 text-(--muted)"
        : "bg-white border border-slate-200 text-(--muted)";

    const total = tasks.length;

    const withCounts = statuses.map((s) => ({
        ...s,
        count: tasks.filter((t) => t.status === s.value).length,
    }));

    const doneCount = tasks.filter((t) => t.status === "done").length;
    const inProgressCount = tasks.filter(
        (t) => t.status === "in_progress"
    ).length;

    return (
        <div className="space-y-4 text-[0.7rem] text-(--fg-color)">
            {/* Übersicht */}
            <div className="space-y-1">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-(--muted)">
                    Übersicht
                </div>
                <div className="flex flex-col gap-1.25">
                    <div className="flex items-baseline justify-between">
                        <span className="text-(--muted)">Tasks gesamt</span>
                        <span className="text-xs font-semibold text-(--fg-color-strong)">
                            {total}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-(--muted)">In Arbeit</span>
                        <span className="text-[0.7rem] text-sky-500">
                            {inProgressCount}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-(--muted)">Fertig</span>
                        <span className="text-[0.7rem] text-emerald-500">
                            {doneCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* Ansicht: Board / Papierkorb */}
            <div className="space-y-1.5">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-(--muted)">
                    Ansicht
                </div>
                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => onViewModeChange("board")}
                        className={`flex-1 px-2.5 py-1.5 rounded-xl text-[0.7rem] border transition ${viewMode === "board"
                            ? "bg-(--accent-soft) border-(--accent) text-(--accent-strong)"
                            : isDark
                                ? "bg-slate-950/40 border-slate-800 text-(--muted)"
                                : "bg-white border-slate-200 text-(--muted)"
                            }`}
                    >
                        Board
                    </button>
                    <button
                        type="button"
                        onClick={() => onViewModeChange("trash")}
                        className={`flex-1 px-2.5 py-1.5 rounded-xl text-[0.7rem] border transition ${viewMode === "trash"
                            ? "bg-red-500/10 border-red-400 text-red-500"
                            : isDark
                                ? "bg-slate-950/40 border-slate-800 text-(--muted)"
                                : "bg-white border-slate-200 text-(--muted)"
                            }`}
                    >
                        Papierkorb
                        {typeof trashCount === "number" && trashCount > 0 && (
                            <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/90 text-[0.6rem] text-white">
                                {trashCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Status-Filter (im Trash nur optisch, ohne Interaktion) */}
            <div className="space-y-1.5">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-(--muted)">
                    Status-Filter
                </div>

                {/* Alle */}
                <div
                    className={`${chipBase} ${effectiveActiveStatus === "all"
                        ? chipActive
                        : chipInactive
                        } ${isTrash ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => {
                        if (isTrash) return;
                        onStatusFilterChange("all");
                    }}
                >
                    <span>Alle</span>
                    <span className="text-[0.7rem]">{total}</span>
                </div>

                {/* Einzelne Stati */}
                {withCounts.map((s) => (
                    <div
                        key={s.value}
                        className={`${chipBase} ${effectiveActiveStatus === s.value
                            ? chipActive
                            : chipInactive
                            } ${isTrash ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => {
                            if (isTrash) return;
                            onStatusFilterChange(s.value);
                        }}
                    >
                        <div className="flex items-center gap-1.25">
                            <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" />
                            <span>{s.label}</span>
                        </div>
                        <span className="text-[0.7rem]">
                            {s.count}
                        </span>
                    </div>
                ))}
            </div>

            {/* Tools (im Trash deaktiviert) */}
            <div className="space-y-1.5">
                <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-(--muted)">
                    Tools
                </div>
                <div className="flex flex-col gap-1.5">
                    <button
                        type="button"
                        disabled={isTrash}
                        onClick={() => {
                            if (isTrash) return;
                            onStatusFilterChange("todo");
                        }}
                        className={`w-full rounded-xl px-3 py-1.5 text-[0.7rem] transition ${isDark
                            ? "border border-slate-800 bg-slate-950/90 text-(--fg-color)"
                            : "border border-slate-200 bg-white text-(--fg-color)"
                            } ${isTrash
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:border-(--accent) hover:text-(--accent-strong)"
                            }`}
                    >
                        Fokus: Nur offene
                    </button>
                    <button
                        type="button"
                        disabled={isTrash}
                        className={`w-full rounded-xl px-3 py-1.5 text-[0.7rem] transition ${isDark
                            ? "border border-slate-800 bg-slate-950/90 text-(--fg-color)"
                            : "border border-slate-200 bg-white text-(--fg-color)"
                            } ${isTrash
                                ? "opacity-40 cursor-not-allowed"
                                : "hover:border-(--accent) hover:text-(--accent-strong)"
                            }`}
                    >
                        Heute fällige
                    </button>
                </div>
            </div>
        </div>
    );
}
