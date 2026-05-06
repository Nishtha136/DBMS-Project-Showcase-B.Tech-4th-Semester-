"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { api } from "@/lib/api";

export function BulkTaskModal({
  trigger, studentIds, onSuccess,
}: {
  trigger: React.ReactNode;
  studentIds: string[];
  onSuccess?: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen]       = useState(false);
  const [title, setTitle]     = useState("");
  const [description, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError]     = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/mentor/tasks/bulk", {
        student_ids: studentIds,
        title:       title.trim(),
        description: description || null,
        due_date:    dueDate || null,
        priority,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mentees"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      onSuccess?.();
      setOpen(false);
      setTimeout(() => {
        setTitle(""); setDesc(""); setDueDate(""); setPriority("medium"); setError(null);
      }, 150);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e.message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={`Assign task to ${studentIds.length} mentee${studentIds.length === 1 ? "" : "s"}`}
        description="Each selected mentee receives a copy of this task."
      >
        <form
          onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
          className="space-y-3"
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   required minLength={2} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description}
                      onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="datetime-local" value={dueDate}
                     onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="prio">Priority</Label>
              <Select
                id="prio"
                value={priority}
                onChange={setPriority}
                options={[
                  { value: "low",    label: "Low"    },
                  { value: "medium", label: "Medium" },
                  { value: "high",   label: "High"   },
                ]}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200
                            rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={m.isPending}
                    disabled={studentIds.length === 0}>
              Assign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
