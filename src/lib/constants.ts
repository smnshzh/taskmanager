// Central domain constants for the PMO Organizational Planning unit.

export const DEPARTMENTS = [
  { key: "FANTASY", label: "تأمین فانتزی", short: "فانتزی", color: "violet" },
  { key: "NON_FANTASY", label: "تأمین غیر فانتزی", short: "غیرفانتزی", color: "emerald" },
  { key: "BI", label: "هوش تجاری (BI)", short: "BI", color: "amber" },
  { key: "COMMISSION", label: "پورسانت و گزارش‌ها", short: "پورسانت", color: "rose" },
] as const;

export type DepartmentKey = (typeof DEPARTMENTS)[number]["key"];

export const PRIORITIES = [
  { key: "HIGH", label: "بالا", color: "rose", weight: 3 },
  { key: "MEDIUM", label: "متوسط", color: "amber", weight: 2 },
  { key: "LOW", label: "پایین", color: "slate", weight: 1 },
] as const;

export type PriorityKey = (typeof PRIORITIES)[number]["key"];

export const STATUSES = [
  { key: "PENDING", label: "در صف انجام", short: "صف", color: "slate" },
  { key: "STARTED", label: "در حال انجام", short: "در حال", color: "sky" },
  { key: "BLOCKED", label: "مسدود شده", short: "مسدود", color: "rose" },
  { key: "DONE", label: "انجام شده", short: "انجام‌شده", color: "emerald" },
] as const;

export type StatusKey = (typeof STATUSES)[number]["key"];

// Kanban column order
export const KANBAN_ORDER: StatusKey[] = ["PENDING", "STARTED", "BLOCKED", "DONE"];

export const FOLLOW_UP_REASONS = [
  {
    key: "DEPENDENT_ON_OTHERS",
    label: "وابسته به شخص دیگر",
    icon: "users",
  },
  {
    key: "LACK_OF_INFO",
    label: "کمبود اطلاعات",
    icon: "info",
  },
  {
    key: "HIGH_WORKLOAD",
    label: "حجم بالای کار",
    icon: "layers",
  },
  {
    key: "TECHNICAL_ISSUE",
    label: "مشکل فنی",
    icon: "wrench",
  },
  {
    key: "OTHER",
    label: "سایر",
    icon: "more-horizontal",
  },
] as const;

export type FollowUpReasonKey = (typeof FOLLOW_UP_REASONS)[number]["key"];

export function departmentByKey(key: string) {
  return DEPARTMENTS.find((d) => d.key === key);
}
export function priorityByKey(key: string) {
  return PRIORITIES.find((p) => p.key === key);
}
export function statusByKey(key: string) {
  return STATUSES.find((s) => s.key === key);
}
export function reasonByKey(key: string) {
  return FOLLOW_UP_REASONS.find((r) => r.key === key);
}
