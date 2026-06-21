"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DepartmentBadge, PriorityBadge, StatusBadge } from "./badges";
import type { SerializedTask } from "@/lib/serialize";
import {
  formatJalaliLong,
  formatTime,
  toPersianDigits,
  isOverdue,
  isToday,
} from "@/lib/jalali";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowLeft,
  CalendarClock,
  Users,
} from "lucide-react";
import { usePMOStore, type ViewKey } from "@/lib/pmo-store";
import { cn } from "@/lib/utils";

type Stats = {
  today: string;
  totals: {
    all: number;
    PENDING: number;
    STARTED: number;
    BLOCKED: number;
    DONE: number;
    overdue: number;
    todayDue: number;
  };
  overdueByDept: { key: string; label: string; color: string; value: number }[];
  obstacles: { key: string; label: string; value: number }[];
  deptSummary: {
    key: string;
    label: string;
    color: string;
    total: number;
    done: number;
    active: number;
    overdue: number;
    blocked: number;
  }[];
};

interface Props {
  onNewTask: () => void;
  tasks: SerializedTask[];
}

export function OverviewView({ onNewTask, tasks }: Props) {
  const setView = usePMOStore((s) => s.setView);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats");
      return (await r.json()) as Stats;
    },
  });

  const now = new Date();
  const todayDue = tasks.filter(
    (t) => t.status !== "DONE" && isToday(new Date(t.deadline))
  );
  const overdueTasks = tasks.filter((t) => isOverdue(new Date(t.deadline), t.status));
  const needsFollowUp = [...todayDue, ...overdueTasks.filter((t) => !todayDue.includes(t))].slice(0, 6);

  const t = data?.totals;

  return (
    <ScrollArea className="h-full scroll-area-pmo">
      <div className="space-y-4 pb-4">
        {/* Hero */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {formatJalaliLong(now)} — {toPersianDigits(formatTime(now))}
                </p>
                <h2 className="text-2xl font-bold">
                  خوش آمدید، مدیر واحد برنامه‌ریزی
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {data?.summaryNote ??
                    `${toPersianDigits(t?.all ?? 0)} تسک در حال پیگیری، ${toPersianDigits(t?.overdue ?? 0)} مورد عقب‌افتاده.`}
                </p>
              </div>
              <Button size="lg" onClick={onNewTask} className="shrink-0">
                <Plus className="h-5 w-5" />
                ثبت تسک جدید
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="کل تسک‌ها"
            value={t?.all ?? 0}
            icon={<ClipboardList className="h-5 w-5" />}
            tone="slate"
            onClick={() => setView("list")}
          />
          <KpiCard
            label="در حال انجام"
            value={(t?.STARTED ?? 0) + (t?.PENDING ?? 0)}
            icon={<Clock className="h-5 w-5" />}
            tone="sky"
            onClick={() => setView("kanban")}
          />
          <KpiCard
            label="انجام‌شده"
            value={t?.DONE ?? 0}
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="emerald"
            onClick={() => setView("kanban")}
          />
          <KpiCard
            label="عقب‌افتاده / مسدود"
            value={(t?.overdue ?? 0) + (t?.BLOCKED ?? 0)}
            icon={<AlertTriangle className="h-5 w-5" />}
            tone="rose"
            onClick={() => setView("bi")}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Needs follow-up */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    نیازمند پیگیری فوری
                  </CardTitle>
                  <CardDescription>
                    تسک‌هایی که امروز سررسید شده یا عقب‌افتاده‌اند.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setView("reports")}>
                  مشاهده گزارش‌ها
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-md" />)}
              {!isLoading && needsFollowUp.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-1 text-emerald-500" />
                  همه چیز under control است.
                </div>
              )}
              {needsFollowUp.map((task) => {
                const dl = new Date(task.deadline);
                const overdue = isOverdue(dl, task.status);
                const today = isToday(dl);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 rounded-md border bg-card p-2.5 text-sm"
                  >
                    <span>{overdue ? "🔴" : today ? "🟡" : "•"}</span>
                    <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
                    <span className="flex-1 line-clamp-1 font-medium">{task.title}</span>
                    <DepartmentBadge department={task.department} />
                    <PriorityBadge priority={task.priority} />
                    <span
                      className={cn(
                        "text-xs nums-fa shrink-0",
                        overdue
                          ? "text-rose-600 dark:text-rose-400 font-medium"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatJalaliLong(dl)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Obstacles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                تحلیل موانع
              </CardTitle>
              <CardDescription>علت عدم انجام تسک‌ها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data?.obstacles.map((o) => {
                const total = data.obstacles.reduce((a, b) => a + b.value, 0);
                const pct = total > 0 ? (o.value / total) * 100 : 0;
                return (
                  <div key={o.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{o.label}</span>
                      <span className="nums-fa font-medium">{toPersianDigits(o.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Department summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  عملکرد به تفکیک بخش
                </CardTitle>
                <CardDescription>
                  وضعیت کلی ۴ زیرمجموعه واحد برنامه‌ریزی
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setView("bi")}>
                داشبورد هوش تجاری
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {data?.deptSummary.map((d) => {
                const donePct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0;
                return (
                  <div key={d.key} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <DepartmentBadge department={d.key} />
                      <span className="text-xs text-muted-foreground nums-fa">
                        {toPersianDigits(d.done)}/{toPersianDigits(d.total)}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">درصد انجام</span>
                        <span className="nums-fa font-medium text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(donePct)}٪
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${donePct}%` }} />
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground">عقب‌افتاده</span>
                        <span
                          className={cn(
                            "nums-fa font-medium",
                            d.overdue > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                          )}
                        >
                          {toPersianDigits(d.overdue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مسدود</span>
                        <span
                          className={cn(
                            "nums-fa font-medium",
                            d.blocked > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                          )}
                        >
                          {toPersianDigits(d.blocked)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "slate" | "sky" | "emerald" | "rose";
  onClick?: () => void;
}) {
  const toneClasses = {
    slate: "text-slate-600 bg-slate-100 dark:bg-slate-800/50 dark:text-slate-300",
    sky: "text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300",
    emerald: "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "text-rose-700 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300",
  }[tone];
  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-primary/40 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className={cn("h-9 w-9 rounded-lg flex items-center justify-center", toneClasses)}>
            {icon}
          </span>
        </div>
        <div className="text-3xl font-bold nums-fa">{toPersianDigits(value)}</div>
      </CardContent>
    </Card>
  );
}

// helper view type usage to avoid unused import lint
export type { ViewKey };
