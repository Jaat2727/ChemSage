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
    <div className="mb-6 flex animate-slide-up flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-overline mb-1.5 text-[var(--fg-faint)]">Workspace</p>
        <h1 className="text-h1">{title}</h1>
        <p className="text-body mt-1.5 max-w-2xl">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {profile ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-overlay)] px-3 py-1.5 text-caption text-[var(--fg-muted)]">
            {formatBadge(profile.programme, profile.batch_year)}
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}
