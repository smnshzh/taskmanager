import { cn } from "@/lib/utils";
import {
  DEPARTMENTS,
  PRIORITIES,
  STATUSES,
  FOLLOW_UP_REASONS,
  departmentByKey,
  priorityByKey,
  statusByKey,
  reasonByKey,
} from "@/lib/constants";
import { Clock, AlertTriangle, CheckCircle2, Pause, Circle } from "lucide-react";

// Static class maps so Tailwind keeps the classes.
const deptClasses: Record<string, string> = {
  violet: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
};

const deptDot: Record<string, string> = {
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const priorityClasses: Record<string, string> = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  LOW: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
};

const statusClasses: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
  STARTED: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  BLOCKED: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  DONE: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
};

export function DepartmentBadge({ department, className }: { department: string; className?: string }) {
  const d = departmentByKey(department);
  if (!d) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        deptClasses[d.color],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", deptDot[d.color])} />
      {d.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const p = priorityByKey(priority);
  if (!p) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        priorityClasses[p.key],
        className
      )}
    >
      {p.label}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = statusByKey(status);
  if (!s) return null;
  const Icon =
    s.key === "DONE" ? CheckCircle2 : s.key === "STARTED" ? Clock : s.key === "BLOCKED" ? Pause : Circle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        statusClasses[s.key],
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {s.label}
    </span>
  );
}

export function ReasonBadge({ reason, className }: { reason: string; className?: string }) {
  const r = reasonByKey(reason);
  if (!r) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {r.label}
    </span>
  );
}

export { deptClasses, deptDot, priorityClasses, statusClasses };
export { DEPARTMENTS, PRIORITIES, STATUSES, FOLLOW_UP_REASONS };
