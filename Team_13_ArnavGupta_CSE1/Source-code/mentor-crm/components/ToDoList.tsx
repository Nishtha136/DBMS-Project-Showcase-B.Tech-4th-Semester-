"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/cn";

type ColorKey = "brand" | "amber" | "rose" | "violet" | "sky" | "neutral";

type Todo = {
  id: string;
  text: string;
  color: ColorKey;
  done: boolean;
  createdAt: number;
};

const COLOR_BAR: Record<ColorKey, string> = {
  brand:   "bg-brand-100 text-brand-800",
  amber:   "bg-amber-100 text-amber-800",
  rose:    "bg-rose-100 text-rose-800",
  violet:  "bg-violet-100 text-violet-800",
  sky:     "bg-sky-100 text-sky-800",
  neutral: "bg-ink-100 text-ink-800",
};

const COLOR_DOT: Record<ColorKey, string> = {
  brand:   "bg-brand-400",
  amber:   "bg-amber-400",
  rose:    "bg-rose-400",
  violet:  "bg-violet-400",
  sky:     "bg-sky-400",
  neutral: "bg-ink-400",
};

const COLORS: ColorKey[] = ["brand", "amber", "rose", "violet", "sky", "neutral"];

const STORAGE_PREFIX = "studylabs.todos.";

export function ToDoList() {
  const [uid, setUid] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");
  const [draftColor, setDraftColor] = useState<ColorKey>("brand");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const session = getSession();
    const id = session?.uid || "anon";
    setUid(id);
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + id);
      if (raw) setTodos(JSON.parse(raw));
    } catch {
      // corrupted storage — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !uid) return;
    localStorage.setItem(STORAGE_PREFIX + uid, JSON.stringify(todos));
  }, [todos, uid, hydrated]);

  function addTodo() {
    const text = draft.trim();
    if (!text) return;
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        color: draftColor,
        done: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setDraft("");
  }

  function toggleDone(id: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function setColor(id: string, color: ColorKey) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-do</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="What needs doing?"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTodo();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={addTodo}
            disabled={!draft.trim()}
            className="bg-brand-50 text-brand-700 hover:bg-brand-100 shrink-0 px-3"
          >
            <Plus size={14} /> Add
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-ink-500 mr-1">Color</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Pick ${c} color`}
              onClick={() => setDraftColor(c)}
              className={cn(
                "h-4 w-4 rounded-full transition-all",
                COLOR_DOT[c],
                draftColor === c ? "ring-2 ring-offset-1 ring-ink-400 scale-110" : "hover:scale-110"
              )}
            />
          ))}
        </div>

        {todos.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-500">
            Notes you jot down stay here.
          </div>
        ) : (
          <ul className="space-y-2">
            {todos.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "rounded-md px-3 py-2 flex items-center gap-2",
                  COLOR_BAR[t.color]
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleDone(t.id)}
                  className={cn(
                    "flex-1 text-left text-sm break-words min-w-0",
                    t.done && "line-through opacity-60"
                  )}
                >
                  {t.text}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Set ${c}`}
                      onClick={() => setColor(t.id, c)}
                      className={cn(
                        "h-2.5 w-2.5 rounded-full transition-transform",
                        COLOR_DOT[c],
                        t.color === c ? "ring-1 ring-ink-700 scale-125" : "hover:scale-125"
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => remove(t.id)}
                  className="shrink-0 text-current/60 hover:text-current"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
