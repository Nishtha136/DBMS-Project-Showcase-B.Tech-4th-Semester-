"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ListTodo, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Checkbox } from "@/components/ui/Checkbox";
import { Avatar } from "@/components/ActivityList";
import { AddMenteeModal } from "@/components/AddMenteeModal";
import { BulkTaskModal } from "@/components/BulkTaskModal";
import { fmtDateTime } from "@/lib/format";

type Mentee = {
  student_id: string;
  full_name: string;
  email: string;
  last_login_at: string | null;
  last_activity_at: string | null;
  is_active: number;
  subjects_count: number;
  files_count: number;
  total_habits: number;
  daily_entries_7d: number;
  open_tasks: number;
  study_minutes_7d: number;
  total_study_minutes: number;
};

function fmtMinutes(min: number | undefined | null): string {
  if (min == null || min < 1) return "0m";
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

type ListResponse = {
  data: Mentee[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

const SORT_OPTIONS = [
  { value: "name",          label: "Name (A→Z)"          },
  { value: "habit_logs",    label: "Daily entries (7d)"  },
  { value: "subjects",      label: "Subjects"            },
  { value: "last_active",   label: "Last active"         },
];

const FILTER_OPTIONS = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "inactive", label: "Inactive" },
];

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function MenteesPage() {
  const [search, setSearch]   = useState("");
  const [sort, setSort]       = useState("name");
  const [order, setOrder]     = useState<"asc" | "desc">("asc");
  const [status, setStatus]   = useState("all");
  const [page, setPage]       = useState(1);
  const debounced = useDebounced(search, 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Warm the detail-page cache when the user is about to navigate (hover/focus
  // on the row or its links). React Query dedupes in-flight fetches, so it is
  // safe to fire this on every hover -- subsequent calls are no-ops while the
  // entry is still fresh per the global staleTime.
  function prefetchMentee(id: string) {
    queryClient.prefetchQuery({
      queryKey: ["mentee", id],
      queryFn: async () => (await api.get(`/mentor/mentees/${id}`)).data,
    });
  }

  // Reset to page 1 when filters change.
  useEffect(() => { setPage(1); }, [debounced, sort, order, status]);

  const q = useQuery<ListResponse>({
    queryKey: ["mentees", { search: debounced, sort, order, status, page }],
    queryFn: async () => {
      const { data } = await api.get<ListResponse>("/mentor/mentees", {
        params: {
          search: debounced || undefined,
          sort, order,
          filter_status: status === "all" ? undefined : status,
          page, limit: 20,
        },
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });

  const rows = q.data?.data ?? [];
  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r.student_id));
  const someChecked = rows.some((r) => selected.has(r.student_id)) && !allChecked;

  function toggleAll(v: boolean | "indeterminate") {
    setSelected((prev) => {
      const next = new Set(prev);
      if (v === true) rows.forEach((r) => next.add(r.student_id));
      else            rows.forEach((r) => next.delete(r.student_id));
      return next;
    });
  }

  function toggleOne(id: string, v: boolean | "indeterminate") {
    setSelected((prev) => {
      const next = new Set(prev);
      v === true ? next.add(id) : next.delete(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mentees</h1>
          <p className="text-sm text-ink-500">
            {q.data ? `${q.data.total} total` : "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <BulkTaskModal
              studentIds={[...selected]}
              onSuccess={() => setSelected(new Set())}
              trigger={
                <Button variant="outline">
                  <ListTodo size={14} />
                  Assign task ({selected.size})
                </Button>
              }
            />
          )}
          <AddMenteeModal trigger={<Button>Add mentee</Button>} />
        </div>
      </div>

      <Card>
        <CardBody className="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="pl-8"
              />
            </div>
            <Select value={sort} onChange={setSort} options={SORT_OPTIONS} />
            <Select value={order} onChange={(v) => setOrder(v as any)}
                    options={[
                      { value: "asc",  label: "Asc"  },
                      { value: "desc", label: "Desc" },
                    ]} />
            <Select value={status} onChange={setStatus} options={FILTER_OPTIONS} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr className="text-left text-xs uppercase text-ink-500">
                <th className="px-4 py-2.5 w-10">
                  <Checkbox
                    aria-label="Select all"
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Subjects</th>
                <th className="px-3 py-2.5">Daily entries (7d)</th>
                <th className="px-3 py-2.5">Study (7d)</th>
                <th className="px-3 py-2.5">Habits</th>
                <th className="px-3 py-2.5">Open tasks</th>
                <th className="px-3 py-2.5">Last active</th>
                <th className="px-3 py-2.5 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {q.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-ink-100">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-ink-500">
                    <Users className="mx-auto mb-2 opacity-40" size={28} />
                    <div className="text-sm">No mentees match these filters.</div>
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  // 2-day inactive rule (no activity_log row for 2+ days).
                  const isInactive = !m.last_activity_at ||
                    (Date.now() - new Date(m.last_activity_at).getTime()) > 2 * 86400 * 1000;
                  return (
                    <tr
                      key={m.student_id}
                      className="border-b border-ink-100 hover:bg-ink-50 transition-colors"
                      onMouseEnter={() => prefetchMentee(m.student_id)}
                      onFocus={() => prefetchMentee(m.student_id)}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          aria-label={`Select ${m.full_name}`}
                          checked={selected.has(m.student_id)}
                          onCheckedChange={(v) => toggleOne(m.student_id, v)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/mentor/mentees/${m.student_id}`}
                          className="flex items-center gap-3 hover:text-brand-700"
                        >
                          <Avatar name={m.full_name} />
                          <div className="min-w-0">
                            <div className="font-medium text-ink-900 truncate">
                              {m.full_name}
                            </div>
                            <div className="text-xs text-ink-500 truncate">{m.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-ink-700">{m.subjects_count}</td>
                      <td className="px-3 py-3 text-ink-700">{m.daily_entries_7d}</td>
                      <td className="px-3 py-3 text-ink-700 font-mono text-xs">
                        {fmtMinutes(m.study_minutes_7d)}
                      </td>
                      <td className="px-3 py-3 text-ink-700">{m.total_habits}</td>
                      <td className="px-3 py-3">
                        {m.open_tasks > 0
                          ? <Badge tone="warning">{m.open_tasks}</Badge>
                          : <span className="text-ink-400">0</span>}
                      </td>
                      <td className="px-3 py-3">
                        {isInactive
                          ? <Badge tone="danger">Inactive</Badge>
                          : <span className="text-ink-700 text-xs">{fmtDateTime(m.last_activity_at)}</span>}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={`/mentor/mentees/${m.student_id}`}
                          className="text-brand-700 text-xs hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {q.data && q.data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 text-sm">
            <div className="text-ink-500">
              Page {q.data.page} of {q.data.total_pages} · {q.data.total} mentees
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} /> Prev
              </Button>
              <Button variant="outline" size="sm"
                      disabled={page >= q.data.total_pages}
                      onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
