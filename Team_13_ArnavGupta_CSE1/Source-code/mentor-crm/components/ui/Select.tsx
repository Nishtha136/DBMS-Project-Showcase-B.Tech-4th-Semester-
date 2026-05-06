"use client";

import { ChangeEvent } from "react";
import { cn } from "@/lib/cn";

// A native <select> wrapped to match the rest of the UI. Radix Select has
// far better a11y but this keeps the surface small and dependency-free
// for a project at this scope.
type Option = { value: string; label: string };

export function Select({
  value, onChange, options, className, id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={cn(
        "h-9 rounded-md border border-ink-200 bg-white px-3 pr-8 text-sm",
        "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
