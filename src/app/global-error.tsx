"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6">
          <div className="w-full max-w-md border border-red-900 bg-[#0a0a0a] p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="border border-red-800 bg-red-950/30 p-4 text-red-500">
                <AlertTriangle size={48} strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
              {"> fatal_error"}
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[#666]">
              We encountered a critical error. Please refresh the page or try again.
            </p>
            <button
              onClick={() => reset()}
              className="group flex w-full items-center justify-center gap-2 border border-[#D4FF00] bg-[#D4FF00] px-4 py-3.5 font-bold text-black transition-all active:scale-95"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              <RefreshCcw size={18} className="transition-transform group-hover:-rotate-90" />
              retry()
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
