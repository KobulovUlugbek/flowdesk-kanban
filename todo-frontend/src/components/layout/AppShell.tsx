import type { ReactNode } from "react";
import type { KanbanTheme } from "../../types/kanban";

interface AppShellProps {
    themeMode: KanbanTheme;
    effectiveTheme: "light" | "dark";
    onToggleTheme: () => void;
    sidebar: ReactNode;
    headerActions?: ReactNode;
    children: ReactNode;
}

export function AppShell({
    themeMode,
    effectiveTheme,
    onToggleTheme,
    sidebar,
    headerActions,
    children,
}: AppShellProps) {
    const modeLabel =
        themeMode === "system"
            ? "System"
            : themeMode === "dark"
                ? "Dark"
                : "Light";

    const isLight = effectiveTheme === "light";

    return (
        <div className="min-h-screen bg-(--bg-color) text-(--fg-color) transition-colors duration-300">
            <div className="flex min-h-screen">
                <aside className="hidden md:flex md:flex-col w-64 border-r border-(--border-subtle) bg-(--sidebar-bg) backdrop-blur">
                    <div className="flex items-center gap-2 px-4 py-4 border-b border-(--border-subtle)">
                        <div
                            className={`h-7 w-7 rounded-2xl ${isLight ? "bg-indigo-600" : "bg-indigo-500"
                                }`}
                        />
                        <div className="flex flex-col leading-tight">
                            <span className="text-[0.65rem] font-semibold tracking-[0.16em] uppercase text-(--muted)">
                                Board
                            </span>
                            <span className="text-sm font-semibold tracking-tight">
                                Flowdesk
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                        {sidebar}
                    </div>

                    <div className="px-3 py-3 border-t border-(--border-subtle) flex items-center justify-between gap-2 text-[0.7rem] text-(--muted)">
                        <span className="truncate">Workspace</span>
                        <button
                            type="button"
                            onClick={onToggleTheme}
                            className="px-2.5 py-1 rounded-full border border-(--border-subtle) text-[0.7rem] text-(--fg-color) hover:bg-(--surface-muted) hover:text-(--fg-color-strong) transition-colors"
                        >
                            {modeLabel}
                        </button>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col">
                    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3 border-b border-(--border-subtle) bg-(--surface-color)/95 backdrop-blur">
                        <div className="flex items-baseline gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Jira / Kanban
                            </h1>
                            <span className="hidden md:inline text-xs text-(--muted)">
                                Django REST · React · TypeScript · Tailwind
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {headerActions}
                        </div>
                    </header>

                    <main className="flex-1 px-3 md:px-4 py-4">
                        <div className="mx-auto max-w-6xl">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}
