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
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">ChemSAGE</p>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {profile ? (
          <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300">
            {formatBadge(profile.programme, profile.batch_year)}
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}
