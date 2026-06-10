"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ═══ Modal ══════════════════════════════════════════════════════════════════ */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  titleIcon?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
  /** If true, renders as bottom sheet on mobile */
  sheet?: boolean;
}

export function Modal({ open, onClose, children, title, titleIcon, maxWidth = "md", sheet }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm p-4 animate-fade-in",
        sheet ? "items-end sm:items-center justify-center" : "items-center justify-center",
      )}
      onClick={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          "relative w-full rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-overlay)] shadow-2xl shadow-black/40 max-h-[85vh] overflow-y-auto animate-scale-in",
          maxWidth === "sm" && "max-w-sm",
          maxWidth === "md" && "max-w-md",
          maxWidth === "lg" && "max-w-lg",
        )}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-overlay)] px-6 py-4">
            <h2 className="text-h2 flex items-center gap-2">
              {titleIcon}
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-[var(--radius-md)] p-1.5 text-[var(--fg-faint)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg-default)]"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={cn("p-6", title && "pt-5")}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ═══ Confirm Dialog ═════════════════════════════════════════════════════════ */

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  variant?: "danger" | "success";
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, icon, variant = "danger", confirmLabel = "Confirm", loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} maxWidth="sm">
      <div className="text-center">
        {icon && (
          <div
            className={cn(
              "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
              variant === "danger" ? "bg-[var(--error-muted)] text-[var(--error)]" : "bg-[var(--success-muted)] text-[var(--success)]",
            )}
          >
            {icon}
          </div>
        )}
        <h2 className="text-h2 mb-2">{title}</h2>
        <p className="text-body mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] py-2.5 text-[0.8125rem] font-bold text-[var(--fg-muted)] transition-colors hover:text-[var(--fg-default)]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 rounded-[var(--radius-md)] py-2.5 text-[0.8125rem] font-bold text-white transition-colors disabled:opacity-50",
              variant === "danger" ? "bg-[var(--error)] hover:bg-[#e25555]" : "bg-[var(--success)] hover:bg-[#2bb886]",
            )}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
