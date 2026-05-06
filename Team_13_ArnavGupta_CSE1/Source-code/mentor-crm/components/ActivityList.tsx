import { Activity, FilePlus, FileText, Link2, LogIn, UserPlus,
         CheckCircle2, ListTodo, Bell, Trash2, Edit3, Timer } from "lucide-react";
import { initials, relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Item = {
  id: number | string;
  action_type: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: any;
  performed_at: string;
  full_name?: string;
  email?: string;
};

const ICONS: Record<string, any> = {
  REGISTER:        UserPlus,
  LOGIN:           LogIn,
  CREATE:          FilePlus,
  UPDATE:          Edit3,
  DELETE:          Trash2,
  CREATE_MENTEE:   UserPlus,
  ASSIGN_TASK:     ListTodo,
  UPDATE_TASK:     Edit3,
  COMPLETED_TASK:  CheckCircle2,
  ARCHIVE:         Trash2,
  WELCOME:         Bell,
  CHECK_IN:        CheckCircle2,
  STUDY_START:     Timer,
  STUDY_END:       CheckCircle2,
};

const LABELS: Record<string, string> = {
  REGISTER:       "joined the platform",
  LOGIN:          "signed in",
  CREATE:         "created a new",
  UPDATE:         "updated",
  DELETE:         "removed",
  CREATE_MENTEE:  "onboarded a new mentee",
  ASSIGN_TASK:    "assigned a goal",
  UPDATE_TASK:    "refined a task",
  COMPLETED_TASK: "finished a task",
  ARCHIVE:        "archived",
  CHECK_IN:       "completed a daily check-in",
  STUDY_START:    "started a study session",
  STUDY_END:      "wrapped up a study session",
};

const ENTITY_ICON: Record<string, any> = {
  vault_file:  FileText,
  vault_link:  Link2,
  subject:     FileText,
  account:     UserPlus,
  mentor_task: ListTodo,
  notification: Bell,
};

export function ActivityList({ items, showWho = true }: { items: Item[]; showWho?: boolean }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-ink-500 text-sm">
        <Activity className="mx-auto mb-2 opacity-50" size={20} />
        No activity yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {items.map((it) => {
        const Icon  = ICONS[it.action_type] ?? ENTITY_ICON[it.entity_type ?? ""] ?? Activity;
        const label = LABELS[it.action_type] ?? it.action_type.toLowerCase().replace(/_/g, " ");
        return (
          <li key={it.id} className="py-3 flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-ink-100 text-ink-600 grid place-items-center shrink-0">
              <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink-900">
                {showWho && it.full_name && (
                  <span className="font-medium">{it.full_name} </span>
                )}
                <span className="text-ink-600">{label}</span>
                {it.entity_type && (
                  <span className="text-ink-500"> {it.entity_type.replace(/_/g, " ")}</span>
                )}
              </div>
              {it.metadata && typeof it.metadata === "object" &&
               (it.metadata.title || it.metadata.name || it.metadata.file_name) && (
                <div className={cn("text-xs text-ink-500 truncate")}>
                  {it.metadata.title || it.metadata.name || it.metadata.file_name}
                </div>
              )}
            </div>
            <div className="text-xs text-ink-400 shrink-0">
              {relativeTime(it.performed_at)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full bg-brand-50 text-brand-700 font-semibold grid place-items-center
                 text-xs select-none"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </div>
  );
}
