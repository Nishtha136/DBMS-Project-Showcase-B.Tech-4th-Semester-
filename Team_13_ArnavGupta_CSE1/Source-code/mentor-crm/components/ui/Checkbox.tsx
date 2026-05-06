"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export function Checkbox({
  checked, onCheckedChange, className, "aria-label": ariaLabel,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (v: boolean | "indeterminate") => void;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <CheckboxPrimitive.Root
      aria-label={ariaLabel}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        "h-4 w-4 rounded border border-ink-300 bg-white",
        "data-[state=checked]:bg-brand-500 data-[state=checked]:border-brand-500",
        "data-[state=indeterminate]:bg-brand-500 data-[state=indeterminate]:border-brand-500",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
        className
      )}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        <Check size={12} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
