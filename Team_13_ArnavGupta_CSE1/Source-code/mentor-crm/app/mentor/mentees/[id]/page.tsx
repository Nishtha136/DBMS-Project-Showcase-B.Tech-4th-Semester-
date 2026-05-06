"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FolderOpen, ListChecks, BookOpen,
         GraduationCap, FileQuestion, FileText as FileTextIcon, Hammer,
         Timer, Focus, Bell, Trash2 } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
         ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Avatar, ActivityList } from "@/components/ActivityList";
import { StatsCard } from "@/components/StatsCard";
import { DeleteMenteeModal } from "@/components/DeleteMenteeModal";
import { fmtDate, fmtDateTime } from "@/lib/format";

type Detail = {
  student: any;
  activity: any[];
  notifications: {
    id: string;
    type: string;
    message: string;
    link?: string | null;
    is_read: number;
    created_at: string;
  }[];
  daily_series: { date: string; entry_count: number; avg_score: number }[];
  habits: { habit_id: number; habit_name: string; status: string; logs_7d: number; experiment_duration?: number }[];
  subjects: any[];
  tasks: { id: string; title: string; due_date?: string; priority: string; status: string }[];
  study_sessions: {
    id: string;
    subject_id?: string | null;
    subject_label?: string | null;
    subject_name?: string | null;
    subject_color?: string | null;
    started_at: string;
    ended_at?: string | null;
    duration_minutes?: number | null;
    focus_seconds: number;
    notes?: string | null;
  }[];
  assessments: {
    id: string;
    type: "quiz" | "exam" | "assignment" | "project";
    title: string;
    notes?: string | null;
    due_at?: string | null;
    is_done: number;
    score?: number | null;
    max_score?: number | null;
    subject_name?: string | null;
    subject_color?: string | null;
    is_self: number;
    computed_status: "done" | "overdue" | "due_soon" | "upcoming";
    created_at: string;
  }[];
};

const ASSESSMENT_ICON: Record<string, any> = {
  quiz:       FileQuestion,
  exam:       GraduationCap,
  assignment: FileTextIcon,
  project:    Hammer,
};

function fmtMinutes(min: number | undefined | null): string {
  if (min == null || min < 1) return "0m";
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtSeconds(sec: number | undefined | null): string {
  if (sec == null || sec < 1) return "0s";
  if (sec < 60) return `${Math.round(sec)}s`;
  return fmtMinutes(sec / 60);
}

export default function MenteeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const q = useQuery<Detail>({
    queryKey: ["mentee", id],
    queryFn: async () => (await api.get(`/mentor/mentees/${id}`)).data,
    enabled: !!id,
  });

  const s = q.data?.student;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/mentor/mentees"
              className="text-ink-500 hover:text-ink-900 inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Mentees
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {q.isLoading ? (
          <Skeleton className="h-12 w-12 rounded-full" />
        ) : s ? (
          <Avatar name={s.full_name} size={48} />
        ) : null}
        <div className="flex-1 min-w-0">
          {q.isLoading ? (
            <>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </>
          ) : s ? (
            <>
              <h1 className="text-2xl font-semibold truncate">{s.full_name}</h1>
              <div className="text-sm text-ink-500 truncate">
                {s.email} · last active {fmtDateTime(s.last_login_at)}
              </div>
            </>
          ) : (
            <div className="text-ink-500">Mentee not found.</div>
          )}
        </div>
        {s && (
          <DeleteMenteeModal
            studentId={id}
            studentName={s.full_name}
            onSuccess={() => router.push("/mentor/mentees")}
            trigger={
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 size={14} /> Remove mentee
              </Button>
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard label="Subjects"          icon={FolderOpen} tone="brand"
                   value={s?.subjects_count} loading={q.isLoading} />
        <StatsCard label="Habits"            icon={BookOpen}   tone="neutral"
                   value={s?.habits_count}   loading={q.isLoading} />
        <StatsCard label="Study (7d)"        icon={Timer}      tone="brand"
                   value={fmtMinutes(s?.study_minutes_7d)}
                   loading={q.isLoading}
                   hint={`Total: ${fmtMinutes(s?.total_study_minutes)}`} />
        <StatsCard label="Total focus"       icon={Focus}      tone="brand"
                   value={fmtSeconds(s?.total_focus_seconds)}
                   loading={q.isLoading} />
        <StatsCard label="Open tasks"        icon={ListChecks} tone="warning"
                   value={s?.open_tasks}     loading={q.isLoading} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="study">
            Study
            {q.data?.study_sessions?.length ? (
              <span className="ml-1.5 inline-flex items-center justify-center
                               min-w-4 h-4 px-1 rounded-full bg-ink-200 text-ink-700
                               text-[10px] font-semibold">
                {q.data.study_sessions.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="assessments">
            Assessments
            {q.data?.assessments?.length ? (
              <span className="ml-1.5 inline-flex items-center justify-center
                               min-w-4 h-4 px-1 rounded-full bg-ink-200 text-ink-700
                               text-[10px] font-semibold">
                {q.data.assessments.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications
            {(() => {
              const unread = q.data?.notifications?.filter((n) => n.is_read === 0).length ?? 0;
              return unread > 0 ? (
                <span className="ml-1.5 inline-flex items-center justify-center
                                 min-w-4 h-4 px-1 rounded-full bg-amber-200 text-amber-800
                                 text-[10px] font-semibold">
                  {unread}
                </span>
              ) : null;
            })()}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Daily entries &amp; average score — last 14 days</CardTitle></CardHeader>
            <CardBody>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={q.data?.daily_series ?? []}
                                 margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#5C6373" }}
                      tickFormatter={(v) => fmtDate(v).replace(",", "")}
                    />
                    <YAxis yAxisId="entries" allowDecimals={false}
                           tick={{ fontSize: 11, fill: "#5C6373" }} />
                    <YAxis yAxisId="score" orientation="right" domain={[0, 10]}
                           tick={{ fontSize: 11, fill: "#7C3AED" }} />
                    <Tooltip
                      labelFormatter={(v) => fmtDate(String(v))}
                      formatter={(value: number, name: string) => {
                        if (name === "avg_score") {
                          return [Number(value).toFixed(1), "Avg score"];
                        }
                        return [value, "Entries"];
                      }}
                    />
                    <Bar yAxisId="entries" dataKey="entry_count"
                         fill="#22C1A8" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="score" type="monotone" dataKey="avg_score"
                          stroke="#7C3AED" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="habits">
          <Card>
            <CardBody className="p-0">
              {(q.data?.habits ?? []).length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">
                  No habits yet.
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {q.data!.habits.map((h) => {
                    const target = Math.max(1, h.experiment_duration ?? 7);
                    const pct = Math.min(100, Math.round((h.logs_7d / Math.min(target, 7)) * 100));
                    return (
                      <li key={h.habit_id} className="px-5 py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="font-medium text-ink-900">{h.habit_name}</div>
                            <div className="text-xs text-ink-500 flex items-center gap-2 flex-wrap">
                              <Badge tone={h.status === "active" ? "success" :
                                          h.status === "completed" ? "brand" : "neutral"}>
                                {h.status}
                              </Badge>
                              {h.experiment_duration ? (
                                <Badge tone="neutral">{h.experiment_duration}-day</Badge>
                              ) : null}
                              <span>{h.logs_7d} entries this week</span>
                            </div>
                          </div>
                          <div className="w-40">
                            <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                              <div
                                className="h-full bg-brand-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] text-ink-500 mt-1 text-right">
                              {h.logs_7d}/7 days · {pct}%
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardBody>
              <ActivityList items={q.data?.activity ?? []} showWho={false} />
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          {(q.data?.subjects ?? []).length === 0 ? (
            <Card>
              <CardBody className="py-10 text-center text-ink-500 text-sm">
                No subjects yet.
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {q.data!.subjects.map((s) => (
                <Card key={s.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-ink-900 truncate">{s.name}</div>
                        <div className="text-xs text-ink-500 mt-1">
                          {s.file_count} files · {s.link_count} links
                        </div>
                        <div className="text-xs text-ink-400 mt-2">
                          Last activity {fmtDate(s.last_activity)}
                        </div>
                      </div>
                      <div
                        className="h-8 w-8 rounded-md shrink-0"
                        style={{ background: s.color_hex || "#22C1A8" }}
                      />
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardBody className="p-0">
              {(q.data?.tasks ?? []).length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">
                  No tasks assigned yet.
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {q.data!.tasks.map((t) => (
                    <li key={t.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-ink-900 truncate">{t.title}</div>
                          <div className="text-xs text-ink-500">
                            Due {fmtDate(t.due_date)}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge tone={
                            t.priority === "high"   ? "danger"  :
                            t.priority === "medium" ? "warning" : "neutral"
                          }>{t.priority}</Badge>
                          <Badge tone={
                            t.status === "done"    ? "success" :
                            t.status === "pending" ? "neutral" : "brand"
                          }>{t.status.replace("_", " ")}</Badge>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="study">
          <Card>
            <CardBody className="p-0">
              {(q.data?.study_sessions ?? []).length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">
                  No study sessions logged yet. Sessions appear here once the
                  mentee uses the timer in the mobile app.
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {q.data!.study_sessions.map((ss) => {
                    const subj = ss.subject_name || ss.subject_label;
                    const inFlight = !ss.ended_at;
                    return (
                      <li key={ss.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-md bg-brand-50 text-brand-700
                                            grid place-items-center shrink-0">
                              <Timer size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-ink-900 truncate">
                                {fmtMinutes(ss.duration_minutes)}
                                {inFlight && <span className="text-amber-700 text-xs ml-2">in progress</span>}
                              </div>
                              <div className="text-xs text-ink-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                {subj && (
                                  <span className="inline-flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full"
                                          style={{ background: ss.subject_color || "#22C1A8" }} />
                                    {subj}
                                  </span>
                                )}
                                <span>{fmtDateTime(ss.started_at)}</span>
                                {ss.focus_seconds > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Focus size={10} />
                                    {fmtSeconds(ss.focus_seconds)} focus
                                  </span>
                                )}
                              </div>
                              {ss.notes && (
                                <div className="text-xs text-ink-500 mt-1 line-clamp-2">{ss.notes}</div>
                              )}
                            </div>
                          </div>
                          {ss.focus_seconds > 0 && ss.duration_minutes && ss.duration_minutes > 0 && (
                            <div className="shrink-0 text-right">
                              <div className="text-[10px] text-ink-500 uppercase tracking-wide">Focus</div>
                              <div className="text-xs font-mono text-ink-700">
                                {Math.min(100, Math.round(
                                  (ss.focus_seconds / 60) / ss.duration_minutes * 100
                                ))}%
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardBody className="p-0">
              {(q.data?.assessments ?? []).length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">
                  No assessments yet.
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {q.data!.assessments.map((a) => {
                    const Icon = ASSESSMENT_ICON[a.type] ?? FileTextIcon;
                    const statusTone =
                      a.computed_status === "done"     ? "success" :
                      a.computed_status === "overdue"  ? "danger"  :
                      a.computed_status === "due_soon" ? "warning" : "brand";
                    const scoreText = a.score != null && a.max_score != null
                      ? `${a.score}/${a.max_score}`
                      : a.max_score != null ? `— / ${a.max_score}` : null;
                    return (
                      <li key={a.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-md bg-ink-100 text-ink-600
                                            grid place-items-center shrink-0">
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-ink-900 truncate">
                                {a.title}
                              </div>
                              <div className="text-xs text-ink-500 flex items-center gap-2 mt-0.5">
                                <span className="capitalize">{a.type}</span>
                                {a.subject_name && (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span className="inline-flex items-center gap-1">
                                      <span
                                        className="inline-block h-2 w-2 rounded-full"
                                        style={{ background: a.subject_color || "#22C1A8" }}
                                      />
                                      {a.subject_name}
                                    </span>
                                  </>
                                )}
                                {a.due_at && (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span>Due {fmtDate(a.due_at)}</span>
                                  </>
                                )}
                                {a.is_self === 1 && (
                                  <>
                                    <span aria-hidden>·</span>
                                    <span className="italic">self-tracked</span>
                                  </>
                                )}
                              </div>
                              {a.notes && (
                                <div className="text-xs text-ink-500 mt-1 line-clamp-2">
                                  {a.notes}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge tone={statusTone}>
                              {a.computed_status.replace("_", " ")}
                            </Badge>
                            {scoreText && (
                              <span className="text-xs font-mono text-ink-700">
                                {scoreText}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardBody className="p-0">
              {(q.data?.notifications ?? []).length === 0 ? (
                <div className="py-10 text-center text-ink-500 text-sm">
                  No notifications yet. Alerts appear here once the mentee
                  has welcome, streak, or habit milestones to surface.
                </div>
              ) : (
                <ul className="divide-y divide-ink-100">
                  {q.data!.notifications.map((n) => {
                    const unread = n.is_read === 0;
                    return (
                      <li key={n.id} className="px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-8 w-8 rounded-md grid place-items-center shrink-0 ${
                            unread ? "bg-amber-50 text-amber-700" : "bg-ink-100 text-ink-500"
                          }`}>
                            <Bell size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge tone={unread ? "warning" : "neutral"}>
                                {n.type.replace(/_/g, " ").toLowerCase()}
                              </Badge>
                              {unread && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  unread
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-ink-900 mt-1">{n.message}</div>
                            <div className="text-xs text-ink-500 mt-0.5">
                              {fmtDateTime(n.created_at)}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
