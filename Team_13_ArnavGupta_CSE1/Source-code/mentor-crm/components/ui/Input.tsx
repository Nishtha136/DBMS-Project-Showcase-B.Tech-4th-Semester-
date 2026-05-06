import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm",
          "placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          "disabled:bg-ink-50 disabled:text-ink-400",
          className
        )}
        {...rest}
      />
    );
  }
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[80px] w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm",
          "placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
          className
        )}
        {...rest}
      />
    );
  }
);

export function Label({ children, className, htmlFor }:
  { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("block text-xs font-medium text-ink-700 mb-1.5", className)}>
      {children}
    </label>
  );
}
