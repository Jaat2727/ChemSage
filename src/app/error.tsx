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
    // Log the error to an error reporting service
    console.error("React Error Boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900/80 p-8 text-center backdrop-blur-xl shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 text-red-500">
            <AlertTriangle size={48} strokeWidth={2.5} />
          </div>
        </div>
        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white">
          Something went wrong
        </h2>
        <p className="mb-8 font-medium text-slate-400 leading-relaxed text-sm">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:from-blue-500 hover:to-indigo-500 active:scale-95"
        >
          <RefreshCcw size={18} className="transition-transform group-hover:-rotate-90" />
          Try Again
        </button>
      </div>
    </div>
  );
}
