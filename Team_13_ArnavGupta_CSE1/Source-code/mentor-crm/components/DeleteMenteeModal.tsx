"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, UserMinus, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

type Mode = "delete_all" | "self";

export function DeleteMenteeModal({
  studentId,
  studentName,
  trigger,
  onSuccess,
}: {
  studentId: string;
  studentName: string;
  trigger: React.ReactNode;
  onSuccess?: (mode: Mode) => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen]   = useState(false);
  const [mode, setMode]   = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async (chosenMode: Mode) => {
      const { data } = await api.delete(
        `/mentor/mentees/${studentId}`,
        { params: { mode: chosenMode } },
      );
      return { mode: chosenMode, data };
    },
    onSuccess: ({ mode }) => {
      // Drop every cache entry that referenced this mentee or the roster
      // counts; the user is about to land on /mentor/mentees with stale
      // data otherwise.
      qc.invalidateQueries({ queryKey: ["mentees"] });
      qc.invalidateQueries({ queryKey: ["mentee", studentId] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["activity-feed"] });
      setOpen(false);
      onSuccess?.(mode);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e.message || "Failed to remove mentee");
    },
  });

  function close() {
    setOpen(false);
    // Reset on the next tick so the dialog's exit animation does not show
    // the reset state mid-fade.
    setTimeout(() => { setMode(null); setError(null); }, 150);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : close()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={`Remove ${studentName}?`}
        description="Choose how you want to remove this mentee from your roster."
      >
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setMode("self")}
            className={`w-full text-left p-3 rounded-lg border transition-colors
              ${mode === "self"
                ? "border-brand-500 bg-brand-50"
                : "border-ink-200 hover:bg-ink-50"}`}
          >
            <div className="flex items-start gap-3">
              <UserMinus size={18} className="text-brand-700 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-ink-900">Shift to self mode</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  Remove from your roster but keep the account, study history,
                  habits, vault, and assessments. The mentee continues using
                  the app on their own.
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode("delete_all")}
            className={`w-full text-left p-3 rounded-lg border transition-colors
              ${mode === "delete_all"
                ? "border-red-500 bg-red-50"
                : "border-ink-200 hover:bg-ink-50"}`}
          >
            <div className="flex items-start gap-3">
              <Trash2 size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-ink-900">Delete all data</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  Permanently erase the account along with every subject,
                  vault file, study session, habit log, task, and assessment.
                  This cannot be undone.
                </div>
              </div>
            </div>
          </button>

          {mode === "delete_all" && (
            <div className="flex items-start gap-2 text-xs text-red-700
                            bg-red-50 border border-red-200 rounded-md px-3 py-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                This will hard-delete <strong>{studentName}</strong>'s account.
                Click "Confirm delete" to proceed.
              </span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200
                            rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={mode === "delete_all" ? "danger" : "primary"}
              disabled={!mode}
              loading={m.isPending}
              onClick={() => mode && m.mutate(mode)}
            >
              {mode === "delete_all" ? "Confirm delete" :
               mode === "self"       ? "Shift to self mode" :
                                       "Choose an option"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
