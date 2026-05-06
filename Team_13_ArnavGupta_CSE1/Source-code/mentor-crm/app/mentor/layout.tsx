"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/api";
import { getSession, clearSession } from "@/lib/auth";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    // Verify role server-side. The mentor middleware returns 403 if the
    // account is not actually a mentor; the api.ts interceptor handles
    // 401 on its own.
    api.get("/mentor/overview")
       .then(() => setAuthed(true))
       .catch((err) => {
         if (err?.response?.status === 403) {
           clearSession();
           router.replace("/login");
         } else {
           // Network error etc -- still show the UI; React Query will retry.
           setAuthed(true);
         }
       });
  }, [router]);

  if (!authed) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-ink-500">
        Authorising…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-7xl mx-auto px-6 py-8 md:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
