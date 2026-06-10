import { cn } from "@/lib/utils";

export function LoadingCard({ title = "Loading Workspace..." }: { title?: string }) {
  return (
    <div className="w-full animate-fade-in rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-raised)] p-8 text-center">
      <div className="mx-auto mb-4 h-5 w-5 animate-spinner rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      <p className="text-caption">{title}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="animate-fade-in rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] p-8 text-center">
      <h3 className="text-h3">{title}</h3>
      <p className="text-body mt-2">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function InlineAlert({ tone = "error", message }: { tone?: "error" | "success" | "info"; message?: React.ReactNode }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "animate-slide-down rounded-[var(--radius-md)] border px-4 py-3 text-[0.8125rem] font-medium",
        tone === "error" && "border-[var(--error-border)] bg-[var(--error-muted)] text-[var(--error)]",
        tone === "success" && "border-[var(--success-border)] bg-[var(--success-muted)] text-[var(--success)]",
        tone === "info" && "border-[rgba(212,255,0,0.2)] bg-[var(--accent-muted)] text-[var(--accent)]",
      )}
    >
      {message}
    </div>
  );
}

export function LockedScreen({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl animate-scale-in flex-col items-center justify-center rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-raised)] p-10 text-center shadow-lg">
      <div className="mb-5 rounded-[var(--radius-md)] border border-[var(--warning-border)] bg-[var(--warning-muted)] px-4 py-2 text-overline text-[var(--warning)]">Access Restricted</div>
      <h2 className="text-h1">{title}</h2>
      <p className="text-body mt-3 leading-relaxed">{description}</p>
    </div>
  );
}
