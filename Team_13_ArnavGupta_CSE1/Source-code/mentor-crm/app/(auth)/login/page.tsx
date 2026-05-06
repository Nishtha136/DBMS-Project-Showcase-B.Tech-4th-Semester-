"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { setSession, clearSession, getSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // If already logged in as mentor, skip login.
  useEffect(() => {
    if (getSession()) {
      api.get("/mentor/overview")
         .then(() => router.replace("/mentor"))
         .catch(() => clearSession());
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setSession(data.token, data.name, data.email);

      // Role gate: hit a mentor-only endpoint. 403 means non-mentor account.
      try {
        await api.get("/mentor/overview");
        router.replace("/mentor");
      } catch (gErr: any) {
        clearSession();
        if (gErr?.response?.status === 403) {
          setError("This account is not a mentor. Sign in with a mentor account.");
        } else {
          setError(gErr?.response?.data?.error || "Could not verify mentor role.");
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-500 text-white
                          items-center justify-center font-bold text-xl mb-3">S</div>
          <h1 className="text-xl font-semibold">StudyLabs Mentor CRM</h1>
          <p className="text-sm text-ink-500 mt-1">
            Sign in to track your mentees and assign tasks.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email"
                       value={email} onChange={(e) => setEmail(e.target.value)}
                       required />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password"
                       value={password} onChange={(e) => setPassword(e.target.value)}
                       required minLength={6} />
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200
                                rounded-md px-3 py-2">{error}</div>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full">
                <LogIn size={16} />
                Sign in
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="text-xs text-ink-500 text-center mt-4">
          Mentor-only. Students should use the mobile app.
        </p>
      </div>
    </main>
  );
}
