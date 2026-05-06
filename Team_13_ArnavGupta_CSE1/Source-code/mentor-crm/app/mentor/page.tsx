"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, UserCheck, UserX, FolderOpen, ListTodo, 
  ArrowRight, Timer, TrendingUp, Sparkles, Zap, Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ActivityList } from "@/components/ActivityList";
import { AddMenteeModal } from "@/components/AddMenteeModal";
import { ToDoList } from "@/components/ToDoList";
import { cn } from "@/lib/cn";

type Overview = {
  total_mentees: number;
  active_2d: number;
  inactive_count: number;
  total_subjects: number;
  open_tasks: number;
  total_study_minutes: number;
  study_minutes_7d: number;
};

function fmtMinutes(min: number | undefined): string {
  if (!min || min < 1) return "0m";
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function OverviewPage() {
  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: async () => (await api.get<Overview>("/mentor/overview")).data,
    refetchInterval: 60000,
  });

  const recent = useQuery({
    queryKey: ["activity-feed", { page: 1, limit: 10 }],
    queryFn: async () => {
      const { data } = await api.get("/mentor/activity-feed", {
        params: { page: 1, limit: 10 },
      });
      return data;
    },
  });

  const engagementRate = overview.data 
    ? Math.round((overview.data.active_2d / (overview.data.total_mentees || 1)) * 100) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-12">
      {/* Humanized Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            Managing <span className="text-blue-600 font-bold">{overview.data?.total_mentees ?? 0} students</span> in your roster.
            <Sparkles size={16} className="text-amber-400" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mentor/mentees?filter_status=inactive">
            <Button variant="outline" className="rounded-xl font-bold border-slate-200">
              Review Inactive
            </Button>
          </Link>
          <AddMenteeModal trigger={
            <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 font-bold shadow-lg shadow-slate-200">
              New Student
            </Button>
          } />
        </div>
      </header>

      {/* Grid of Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="My Mentees" icon={Users} tone="brand"
          value={overview.data?.total_mentees}
          loading={overview.isLoading}
          hint="Total students assigned"
        />
        <StatsCard
          label="Engaged Now" icon={UserCheck} tone="success"
          value={overview.data?.active_2d}
          loading={overview.isLoading}
          hint="Active in last 48h"
        />
        <StatsCard
          label="Action Needed" icon={UserX} tone="warning"
          value={overview.data?.inactive_count}
          loading={overview.isLoading}
          hint="Inactive students"
        />
        <StatsCard
          label="Total Study" icon={Timer} tone="neutral"
          value={fmtMinutes(overview.data?.study_minutes_7d)}
          loading={overview.isLoading}
          hint="Collective hours (7d)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Activity Stream */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              Recent Updates
            </h2>
            <Link href="/mentor/activity" className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">
              View All Activity
            </Link>
          </div>
          
          <Card className="border-slate-100 shadow-sm overflow-hidden rounded-3xl">
            <CardBody className="p-0">
              {recent.isLoading ? (
                <div className="p-10 space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-full bg-slate-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="px-6">
                  <ActivityList items={(recent.data?.data ?? []).slice(0, 10)} />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Action & Performance Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-emerald-600" size={20} />
              Engagement
            </h2>
            <Card className="bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200 p-8 space-y-6 border-none">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Roster Health
                </p>
                <div className="text-5xl font-black tabular-nums tracking-tight">
                  {engagementRate}%
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${engagementRate}%` }} 
                />
              </div>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                Percentage of your mentees who have logged activity in the last 48 hours.
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Zap className="text-amber-500" size={20} />
              Quick Links
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/mentor/mentees">
                <div className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Manage Students</span>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
              <Link href="/mentor/analytics">
                <div className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Analytics Reports</span>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </div>
          </div>
          <ToDoList />
        </div>
      </div>
    </div>
  );
}
