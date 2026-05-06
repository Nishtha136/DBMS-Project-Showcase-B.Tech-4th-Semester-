"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Trophy, Star, AlertCircle, Award, Users, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { fmtDate, fmtNumber } from "@/lib/format";

const PALETTE = [
  "#22C1A8", "#1E66F5", "#F59E0B", "#10B981", "#7C3AED",
  "#F43F5E", "#F97316", "#06B6D4", "#0EA5E9", "#4F46E5",
];

type ActivityRow = { week_start: string; student_id: string; full_name: string; activity_count: number };
type LeaderRow   = { student_id: string; full_name: string; email: string; rank: number; value: number };

export default function AnalyticsPage() {
  const [weeks,  setWeeks]  = useState("4");
  const [metric, setMetric] = useState("habit_logs");

  const activity = useQuery({
    queryKey: ["analytics-activity", weeks],
    queryFn: async () => {
      const { data } = await api.get<{ data: ActivityRow[] }>(
        "/mentor/analytics/activity", { params: { weeks } });
      return data;
    },
  });

  const leaderboard = useQuery({
    queryKey: ["leaderboard", metric],
    queryFn: async () => {
      const { data } = await api.get<{ data: LeaderRow[]; metric_label: string }>(
        "/mentor/leaderboard", { params: { metric } });
      return data;
    },
  });

  // --- NEW ADVANCED QUERIES FOR VIVA ---
  const topStudents = useQuery({
    queryKey: ["top-students"],
    queryFn: async () => (await api.get<{ student_name: string; individual_study_time: number }[]>("/mentor/analytics/top-students")).data,
  });

  const performanceSummary = useQuery({
    queryKey: ["performance-summary"],
    queryFn: async () => (await api.get<any[]>("/mentor/analytics/performance-summary")).data,
  });

  const overloadedMentors = useQuery({
    queryKey: ["overloaded-mentors"],
    queryFn: async () => (await api.get<{ mentor_name: string; active_mentee_count: number }[]>("/mentor/admin/overloaded-mentors")).data,
  });

  // Pivot the long-form activity rows into a wide chart-ready array.
  const { chartData, students } = useMemo(() => {
    const rows = activity.data?.data ?? [];
    const studentSet = new Map<string, string>();
    rows.forEach((r) => studentSet.set(r.student_id, r.full_name));
    const studentList = [...studentSet.entries()].map(([id, name]) => ({ id, name }));

    const byWeek = new Map<string, any>();
    rows.forEach((r) => {
      const key = r.week_start;
      if (!byWeek.has(key)) byWeek.set(key, { week_start: key });
      byWeek.get(key)[r.student_id] = r.activity_count;
    });
    return {
      chartData: [...byWeek.values()].sort(
        (a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
      ),
      students: studentList,
    };
  }, [activity.data]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            Monitor <span className="text-emerald-600 font-bold">performance</span>, track activity, and review mentee progress.
          </p>
        </div>
      </header>

      {/* Primary Analytics Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Award className="text-blue-600" size={24} />
          Academic Highlights
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performers Card */}
          <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-8">
              <CardTitle className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center justify-between">
                <span>Top Performers</span>
                <Star className="text-amber-400" size={18} fill="currentColor" />
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {topStudents.isLoading ? <div className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></div> : (
                <ul className="divide-y divide-slate-50">
                  {topStudents.data?.map((s, i) => (
                    <li key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
                          {i + 1}
                        </div>
                        <span className="font-black text-slate-900 text-base">{s.student_name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-emerald-600">{s.individual_study_time}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Minutes</span>
                      </div>
                    </li>
                  ))}
                  {(!topStudents.data || topStudents.data.length === 0) && (
                    <li className="p-8 text-sm text-slate-400 text-center font-medium">No top performers found.</li>
                  )}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Mentor Workload Card */}
          <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-8">
              <CardTitle className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center justify-between">
                <span>Mentor Workload</span>
                <Users className="text-blue-500" size={18} />
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {overloadedMentors.isLoading ? <div className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></div> : (
                <ul className="divide-y divide-slate-50">
                  {overloadedMentors.data?.map((m, i) => (
                    <li key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <AlertCircle size={20} />
                        </div>
                        <span className="font-black text-slate-900 text-base">{m.mentor_name}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-blue-600">{m.active_mentee_count}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
                      </div>
                    </li>
                  ))}
                  {(!overloadedMentors.data || overloadedMentors.data.length === 0) && (
                    <li className="p-8 text-sm text-slate-400 text-center font-medium">No mentors overloaded.</li>
                  )}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Full Performance Summary */}
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white mt-8">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-8">
            <CardTitle className="text-slate-900 text-sm font-black uppercase tracking-widest">
              Cohort Performance Summary
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0 overflow-x-auto">
            {performanceSummary.isLoading ? <div className="p-8"><Skeleton className="h-32 w-full rounded-2xl" /></div> : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Student Name</th>
                    <th className="px-8 py-5">Subjects</th>
                    <th className="px-8 py-5">Study Time</th>
                    <th className="px-8 py-5">Task Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {performanceSummary.data?.map((r, i) => {
                    const progress = Math.min(100, (r.completed_tasks / Math.max(1, r.total_tasks)) * 100);
                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-900 text-base">{r.student_name}</td>
                        <td className="px-8 py-5 font-bold text-slate-500">{r.total_subjects} <span className="text-[10px] uppercase tracking-widest ml-1">Subj</span></td>
                        <td className="px-8 py-5 font-mono font-black text-emerald-600 text-base">{r.total_study_minutes} <span className="text-[10px] font-sans text-slate-400 uppercase tracking-widest ml-1">Min</span></td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="font-black text-slate-700">{r.completed_tasks} / {r.total_tasks}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(!performanceSummary.data || performanceSummary.data.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-medium">
                        No performance data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="border-t border-slate-100 pt-12 space-y-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Activity className="text-amber-500" size={24} />
          Standard Metrics
        </h2>
        
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-8">
              <CardTitle className="text-slate-900 text-sm font-black uppercase tracking-widest">Activity Timeline</CardTitle>
              <div className="mt-4 sm:mt-0">
                <Select
                  value={weeks}
                  onChange={setWeeks}
                  options={[
                    { value: "2",  label: "Last 2 weeks"  },
                    { value: "4",  label: "Last 4 weeks"  },
                    { value: "8",  label: "Last 8 weeks"  },
                    { value: "12", label: "Last 12 weeks" },
                  ]}
                />
              </div>
            </CardHeader>
            <CardBody className="p-8">
              {activity.isLoading ? (
                <Skeleton className="h-72 w-full rounded-2xl" />
              ) : students.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  No activity in the selected window.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F4" vertical={false} />
                      <XAxis
                        dataKey="week_start"
                        tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => fmtDate(v).replace(",", "")}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B", fontWeight: 700 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        labelFormatter={(v) => `Week of ${fmtDate(String(v))}`}
                        contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: '20px' }} />
                      {students.map((s, i) => (
                        <Bar
                          key={s.id}
                          stackId="a"
                          dataKey={s.id}
                          name={s.name}
                          fill={PALETTE[i % PALETTE.length]}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={48}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 border-b border-slate-100 pb-4 pt-6 px-8">
              <CardTitle className="text-slate-900 text-sm font-black uppercase tracking-widest">Leaderboard</CardTitle>
              <div className="mt-4 sm:mt-0">
                <Select
                  value={metric}
                  onChange={setMetric}
                  options={[
                    { value: "habit_logs",    label: "Daily entries" },
                    { value: "study_time",    label: "Study minutes" },
                    { value: "subjects",      label: "Subjects"      },
                    { value: "storage",       label: "Storage (KB)"  },
                  ]}
                />
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {leaderboard.isLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                  ))}
                </div>
              ) : (leaderboard.data?.data ?? []).length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">No data available.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5 w-24">Rank</th>
                      <th className="px-8 py-5">Mentee</th>
                      <th className="px-8 py-5 text-right">{leaderboard.data?.metric_label}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaderboard.data!.data.map((r) => (
                      <tr key={r.student_id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-8 py-5">
                          {r.rank <= 3 ? (
                            <div className="flex items-center gap-2 font-black text-lg">
                              <Trophy size={20}
                                      className={
                                        r.rank === 1 ? "text-amber-500" :
                                        r.rank === 2 ? "text-slate-400" :
                                                        "text-amber-700"
                                      } />
                              <span className="text-slate-800">#{r.rank}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-black text-lg ml-2 group-hover:text-slate-600 transition-colors">#{r.rank}</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-black text-slate-900 text-base">{r.full_name}</div>
                          <div className="text-xs font-bold text-slate-400">{r.email}</div>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-black text-blue-600 text-lg">
                          {r.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
