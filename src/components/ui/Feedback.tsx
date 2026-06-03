import { cn } from "@/lib/utils";

export function LoadingCard({ title = "Loading Workspace..." }: { title?: string }) {
  return (
    <div className="w-full animate-fade-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="animate-fade-in rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-8 text-center">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function InlineAlert({ tone = "error", message }: { tone?: "error" | "success" | "info"; message?: React.ReactNode }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "animate-slide-down rounded-lg border px-4 py-3 text-sm font-medium",
        tone === "error" && "border-red-800 bg-red-950/60 text-red-300",
        tone === "success" && "border-emerald-800 bg-emerald-950/60 text-emerald-300",
        tone === "info" && "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]",
      )}
    >
      {message}
    </div>
  );
}

export function LockedScreen({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl animate-scale-in flex-col items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-lg">
      <div className="mb-5 rounded-lg border border-amber-700 bg-amber-950/40 px-4 py-2 text-sm font-bold uppercase tracking-wider text-amber-300">Access Restricted</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 leading-relaxed text-[var(--muted)]">{description}</p>
    </div>
  );
}
