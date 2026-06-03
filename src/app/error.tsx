"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("React Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6">
      <div className="w-full max-w-md border border-red-900 bg-[var(--surface)] p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="border border-red-800 bg-red-950/30 p-4 text-red-500">
            <AlertTriangle size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-3 font-mono text-2xl font-bold tracking-tight text-white">
          {`> error_caught`}
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-[var(--muted)]">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="group flex w-full items-center justify-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 py-3.5 font-mono font-bold text-black transition-all active:scale-95"
        >
          <RefreshCcw size={18} className="transition-transform group-hover:-rotate-90" />
          retry()
        </button>
      </div>
    </div>
  );
}
