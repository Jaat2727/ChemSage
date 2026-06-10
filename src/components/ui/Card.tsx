import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ═══ Base Card ══════════════════════════════════════════════════════════════ */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "compact" | "default" | "spacious";
}

export function Card({ children, className, hover = false, padding = "default" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-raised)] transition-colors duration-[var(--duration-default)]",
        padding === "compact" && "p-4",
        padding === "default" && "p-5",
        padding === "spacious" && "p-6",
        hover && "hover:border-[var(--border-strong)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ═══ Stat Card ══════════════════════════════════════════════════════════════ */

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  subtext?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, iconColor = "text-[var(--accent)]", trend, subtext, className }: StatCardProps) {
  return (
    <Card padding="compact" className={className}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-overline text-[var(--fg-faint)]">{label}</p>
        {Icon && <Icon size={16} className={iconColor} />}
      </div>
      <p className="text-h1 text-[var(--fg-default)]">{value}</p>
      {trend && (
        <p className={cn("text-caption mt-1", trend.positive ? "text-[var(--success)]" : "text-[var(--error)]")}>
          {trend.value}
        </p>
      )}
      {subtext && (
        <p className="text-caption text-[var(--fg-faint)] mt-1">
          {subtext}
        </p>
      )}
    </Card>
  );
}

/* ═══ Section Header ═════════════════════════════════════════════════════════ */

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, icon: Icon, iconColor, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-overline text-[var(--fg-muted)] flex items-center gap-2">
        {Icon && <Icon size={15} className={iconColor} />}
        {title}
      </h2>
      {action}
    </div>
  );
}
