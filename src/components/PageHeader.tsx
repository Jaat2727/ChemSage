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
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">ChemSAGE</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {profile ? (
          <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300">
            {formatBadge(profile.programme, profile.batch_year)}
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}
