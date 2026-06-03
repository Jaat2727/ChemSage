import { formatBadge } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function PageHeader({
  title,
  description,
  profile,
  action,
}: {
  title: string;
  description: string;
  profile?: Profile | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex animate-slide-up flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">Workspace</p>
        <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {profile ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
            {formatBadge(profile.programme, profile.batch_year)}
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}
