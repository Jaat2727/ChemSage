import { cn } from "@/lib/utils";

export function LoadingCard({ title = "Loading ChemSAGE..." }: { title?: string }) {
  return (
    <div className="w-full animate-fade-in rounded-3xl border border-slate-800/60 bg-slate-900/50 p-8 text-center backdrop-blur-sm">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="animate-fade-in rounded-3xl border border-dashed border-slate-700/60 bg-slate-900/30 p-8 text-center backdrop-blur-sm">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function InlineAlert({ tone = "error", message }: { tone?: "error" | "success" | "info"; message?: React.ReactNode }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "animate-slide-down rounded-xl border px-4 py-3 text-sm font-medium",
        tone === "error" && "border-red-200/80 bg-red-50/90 text-red-700 backdrop-blur-sm",
        tone === "success" && "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 backdrop-blur-sm",
        tone === "info" && "border-blue-200/80 bg-blue-50/90 text-blue-700 backdrop-blur-sm",
      )}
    >
      {message}
    </div>
  );
}

export function LockedScreen({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl animate-scale-in flex-col items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/[0.04] p-8 text-center backdrop-blur-sm">
      <div className="mb-4 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 shadow-sm shadow-amber-500/10">Access restricted</div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 leading-relaxed text-slate-300">{description}</p>
    </div>
  );
}
