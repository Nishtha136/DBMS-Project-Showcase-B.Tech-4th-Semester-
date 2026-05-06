"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-lg bg-ink-100",
        className
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  value, children, className,
}: { value: string; children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn(
        "px-3 py-1.5 text-sm font-medium rounded-md text-ink-600",
        "data-[state=active]:bg-white data-[state=active]:text-ink-900",
        "data-[state=active]:shadow-sm transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
        className
      )}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value, children, className,
}: { value: string; children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.Content
      value={value}
      className={cn("mt-4 focus:outline-none", className)}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
