import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "default";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Bestätigen",
    cancelLabel = "Abbrechen",
    variant = "default",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onCancel]);

    useEffect(() => {
        if (open && dialogRef.current) {
            dialogRef.current
                .querySelector<HTMLElement>('[data-autofocus="true"]')
                ?.focus();
        }
    }, [open]);

    if (!open) return null;

    const confirmClasses =
        variant === "danger"
            ? "border border-red-400 bg-red-500 text-white hover:bg-transparent hover:text-red-400 hover:border-red-300 focus-visible:ring-2 focus-visible:ring-red-400 transition-all"
            : "border border-(--accent) bg-(--accent) text-white hover:bg-transparent hover:text-(--accent-strong) focus-visible:ring-2 focus-visible:ring-(--accent-strong) transition-all";

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0"
                onClick={onCancel}
            />
            <div
                ref={dialogRef}
                className="relative z-50 w-full max-w-sm rounded-2xl border border-(--border-subtle) bg-(--surface-color) px-5 py-4 shadow-2xl"
            >
                <h2 className="text-sm font-semibold text-(--fg-color)">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-[0.75rem] text-slate-500">
                        {description}
                    </p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.75rem] text-slate-600 hover:bg-slate-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        data-autofocus="true"
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-1.5 text-[0.75rem] font-semibold ${confirmClasses}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
