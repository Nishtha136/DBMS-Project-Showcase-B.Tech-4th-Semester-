"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, BarChart3, Activity, LogOut, Menu, X
} from "lucide-react";
import { cn } from "@/lib/cn";
import { clearSession, getSession } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Button } from "./ui/Button";

const NAV = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/mentees", label: "My Mentees", icon: Users },
  { href: "/mentor/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/mentor/activity", label: "Live Feed", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("Mentor");
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) { setName(s.name); setEmail(s.email); }
  }, []);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border-slate-200 shadow-sm"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <span className="font-black text-lg">S</span>
            </div>
            <div>
              <div className="text-sm font-black tracking-tight text-slate-900">StudyLabs</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mentor Portal</div>
            </div>
          </div>
        </div>

        <nav className="px-3 flex-1 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href ||
              (href !== "/mentor" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all group",
                  active
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                )}
              >
                <Icon size={18} className={cn(
                  "transition-colors",
                  active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-900"
                )} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 m-4 bg-white rounded-2xl shadow-sm border">
          <div className="mb-4">
            <div className="text-sm font-bold text-slate-900 truncate">{name}</div>
            <div className="text-[10px] font-medium text-slate-400 truncate uppercase tracking-tight">{email}</div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                       bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
