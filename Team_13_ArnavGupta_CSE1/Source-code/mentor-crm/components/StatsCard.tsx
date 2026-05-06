import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

export function StatsCard({
  label, value, icon: Icon, tone, loading, hint,
}: {
  label: string;
  value: number | string | undefined;
  icon: LucideIcon;
  tone?: "brand" | "warning" | "success" | "neutral";
  loading?: boolean;
  hint?: string;
}) {
  const iconColors = {
    brand:   "text-blue-600 bg-blue-50",
    warning: "text-amber-600 bg-amber-50",
    success: "text-emerald-600 bg-emerald-50",
    neutral: "text-slate-600 bg-slate-50",
  }[tone ?? "brand"];

  return (
    <Card className="p-6 border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl group">
      <div className="flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", iconColors)}>
          <Icon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {typeof value === "number" ? fmtNumber(value) : value ?? "—"}
              </h3>
            </div>
          )}
        </div>
      </div>

      {hint && (
        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-blue-500"
          )} />
          <p className="text-xs font-medium text-slate-500">{hint}</p>
        </div>
      )}
    </Card>
  );
}
