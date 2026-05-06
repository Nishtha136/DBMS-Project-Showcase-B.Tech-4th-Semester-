"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { api } from "@/lib/api";

function generatePassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digit = "23456789";
  const symb  = "!@#$%";
  const alphabet = upper + lower + digit + symb;
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function AddMenteeModal({ trigger }: { trigger: React.ReactNode }) {
  const qc = useQueryClient();
  const [open, setOpen]               = useState(false);
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [tempPassword, setTempPwd]    = useState(generatePassword());
  const [created, setCreated]         = useState<{
    student_id: string; email: string; temp_password: string;
  } | null>(null);
  const [copied, setCopied]           = useState(false);
  const [error,  setError]            = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/mentor/mentees", {
        full_name: fullName.trim(),
        email:     email.trim().toLowerCase(),
        temp_password: tempPassword,
      });
      return data as { student_id: string; email: string; temp_password: string };
    },
    onSuccess: (data) => {
      setCreated(data);
      setError(null);
      qc.invalidateQueries({ queryKey: ["mentees"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e.message || "Failed to create mentee");
    },
  });

  function reset() {
    setFullName(""); setEmail(""); setTempPwd(generatePassword());
    setCreated(null); setCopied(false); setError(null);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 150);
  }

  async function copyCreds() {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Email: ${created.email}\nPassword: ${created.temp_password}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => v ? setOpen(true) : close()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={created ? "Mentee created" : "Add mentee"}
        description={created
          ? "Share these credentials securely. They will not be shown again."
          : "Create a new student account and assign them to your roster."}
      >
        {!created ? (
          <form
            onSubmit={(e) => { e.preventDefault(); m.mutate(); }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required minLength={2} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     required />
            </div>
            <div>
              <Label htmlFor="temp">Temporary password</Label>
              <div className="flex gap-2">
                <Input id="temp" value={tempPassword}
                       onChange={(e) => setTempPwd(e.target.value)}
                       minLength={6} required />
                <Button type="button" variant="outline" size="md"
                        onClick={() => setTempPwd(generatePassword())}>
                  <RefreshCw size={14} />
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200
                              rounded-md px-3 py-2">{error}</div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
              <Button type="submit" loading={m.isPending}>Create mentee</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-ink-50 border border-ink-200 p-3 font-mono text-xs">
              <div><span className="text-ink-500">Email:</span> {created.email}</div>
              <div><span className="text-ink-500">Password:</span> {created.temp_password}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={copyCreds}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy credentials"}
              </Button>
              <Button onClick={close}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
