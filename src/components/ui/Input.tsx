import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ═══ Input ══════════════════════════════════════════════════════════════════ */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-md)] border bg-[var(--bg-base)] px-3.5 py-2.5 text-[0.8125rem] font-medium text-[var(--fg-default)] outline-none transition-all duration-[var(--duration-default)] placeholder:text-[var(--fg-faint)]",
        error
          ? "border-[var(--error)] focus:border-[var(--error)] focus:ring-2 focus:ring-[var(--error-muted)]"
          : "border-[var(--border-default)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]",
        className,
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

/* ═══ Select ═════════════════════════════════════════════════════════════════ */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)] px-3.5 py-2.5 text-[0.8125rem] font-medium text-[var(--fg-default)] outline-none transition-all duration-[var(--duration-default)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]",
        className,
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";

/* ═══ Textarea ═══════════════════════════════════════════════════════════════ */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-base)] px-3.5 py-2.5 text-[0.8125rem] font-medium text-[var(--fg-default)] outline-none transition-all duration-[var(--duration-default)] placeholder:text-[var(--fg-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]",
        className,
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

/* ═══ Label ══════════════════════════════════════════════════════════════════ */

export function Label({ children, className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-overline text-[var(--fg-muted)]", className)} {...props}>
      {children}
    </label>
  );
}
