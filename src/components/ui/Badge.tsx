import { cn } from "@/lib/utils";

/* ═══ Badge ══════════════════════════════════════════════════════════════════ */

type BadgeVariant = "accent" | "success" | "warning" | "error" | "info" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  accent:  "bg-[var(--accent-muted)] text-[var(--accent)] border-[rgba(212,255,0,0.15)]",
  success: "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success-border)]",
  warning: "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning-border)]",
  error:   "bg-[var(--error-muted)] text-[var(--error)] border-[var(--error-border)]",
  info:    "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info-border)]",
  neutral: "bg-[var(--bg-subtle)] text-[var(--fg-muted)] border-[var(--border-default)]",
};

export function Badge({ children, variant = "neutral", className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border font-semibold",
        size === "sm" && "px-2 py-0.5 text-[0.6875rem]",
        size === "md" && "px-2.5 py-1 text-xs",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ═══ Priority Badge ═════════════════════════════════════════════════════════ */

const priorityVariant: Record<string, BadgeVariant> = {
  High: "error",
  Medium: "warning",
  Low: "neutral",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <Badge variant={priorityVariant[priority] || "neutral"}>{priority}</Badge>;
}

/* ═══ Status Badge ═══════════════════════════════════════════════════════════ */

const statusVariant: Record<string, BadgeVariant> = {
  Pending: "warning",
  "In Progress": "info",
  Completed: "success",
  active: "success",
  deleted: "error",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusVariant[status] || "neutral"}>{status}</Badge>;
}

/* ═══ Count Badge ════════════════════════════════════════════════════════════ */

export function CountBadge({ count, variant = "neutral" }: { count: number; variant?: BadgeVariant }) {
  return <Badge variant={variant} size="sm">{count}</Badge>;
}
