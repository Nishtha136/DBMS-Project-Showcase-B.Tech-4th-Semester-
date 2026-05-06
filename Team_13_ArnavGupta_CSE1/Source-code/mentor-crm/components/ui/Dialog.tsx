"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog       = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose   = DialogPrimitive.Close;

export function DialogContent({
  children, className, title, description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-40"
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md",
          "-translate-x-1/2 -translate-y-1/2",
          "bg-white rounded-xl shadow-card border border-ink-200",
          "focus:outline-none",
          className
        )}
      >
        {title && (
          <div className="px-5 pt-5 pb-2">
            <DialogPrimitive.Title className="text-lg font-semibold text-ink-900">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm text-ink-500 mt-1">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
        )}
        <div className="px-5 pb-5">{children}</div>
        <DialogPrimitive.Close
          className="absolute right-3 top-3 p-1.5 rounded-md text-ink-500
                     hover:bg-ink-100 focus:outline-none"
          aria-label="Close"
        >
          <X size={16} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
