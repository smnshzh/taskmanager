"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewTaskDialog } from "./new-task-dialog";
import { OverviewView } from "./overview-view";
import { KanbanView } from "./kanban-view";
import { TaskListView } from "./task-list-view";
import { BIView } from "./bi-view";
import { ReportsView } from "./reports-view";
import { MyTasksView } from "./my-tasks-view";
import { MembersView } from "./members-view";
import { ThemeToggle } from "./theme-toggle";
import { usePMOStore, type ViewKey } from "@/lib/pmo-store";
import type { SerializedTask } from "@/lib/serialize";
import { toPersianDigits, isOverdue } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  ListChecks,
  BarChart3,
  FileBarChart,
  CheckSquare,
  Users,
  Plus,
  Menu,
  X,
  Sun,
  Clock,
} from "lucide-react";

const NAV: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: "overview", label: "داشبورد", icon: LayoutDashboard, desc: "نمای کلی و شاخص‌ها" },
  { key: "kanban", label: "کانبان", icon: KanbanSquare, desc: "نمودار کانبان با درگ‌اند‌دراپ" },
  { key: "list", label: "لیست تسک‌ها", icon: ListChecks, desc: "جدول با فیلترهای پیشرفته" },
  { key: "bi", label: "هوش تجاری", icon: BarChart3, desc: "نمودارها و هیت‌مپ" },
  { key: "reports", label: "گزارش‌ها", icon: FileBarChart, desc: "صبحگاهی و پایان روز" },
  { key: "mytasks", label: "کارهای من", icon: CheckSquare, desc: "نمای کاربر" },
  { key: "members", label: "اعضا", icon: Users, desc: "تیم به تفکیک بخش" },
];

export function DashboardShell() {
  const view = usePMOStore((s) => s.view);
  const setView = usePMOStore((s) => s.setView);
  const [newTaskOpen, setNewTaskOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({
    department: null as string | null,
    priority: null as string | null,
    overdueOnly: false,
  });

  // Fetch all tasks once for overview + overdue badges
  const { data } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const r = await fetch("/api/tasks");
      return (await r.json()) as { tasks: SerializedTask[] };
    },
  });
  const tasks = data?.tasks ?? [];
  const overdueCount = tasks.filter((t) => isOverdue(new Date(t.deadline), t.status)).length;

  const queryClient = useQueryClient();
  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["members"] });
    queryClient.invalidateQueries({ queryKey: ["report"] });
  }

  const currentNav = NAV.find((n) => n.key === view);

  return (
    <div className="h-screen flex flex-col bg-muted/20">
      {/* Top bar */}
      <header className="h-14 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
        <div className="h-full flex items-center gap-3 px-3 sm:px-4">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              پ
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold leading-tight">PMO Agent</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                واحد برنامه‌ریزی سازمان
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <Badge variant="outline" className="gap-1 text-xs font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              آنلاین
            </Badge>
            {overdueCount > 0 && (
              <Badge className="gap-1 text-xs bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                {toPersianDigits(overdueCount)} عقب‌افتاده
              </Badge>
            )}
          </div>

          <div className="mr-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setNewTaskOpen(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">تسک جدید</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "w-60 shrink-0 border-l bg-background flex-col z-20",
            "fixed lg:static inset-y-0 right-0 top-14 lg:top-0",
            "transition-transform lg:translate-x-0",
            mobileNavOpen ? "flex translate-x-0" : "flex translate-x-full lg:translate-x-0"
          )}
        >
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scroll-area-pmo">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.key;
              const count =
                item.key === "list" || item.key === "kanban"
                  ? tasks.length
                  : item.key === "mytasks"
                  ? tasks.filter((t) => t.status !== "DONE").length
                  : null;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setView(item.key);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors text-right",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  {count !== null && count > 0 && (
                    <span
                      className={cn(
                        "text-xs nums-fa rounded-md px-1.5 py-0.5",
                        active ? "bg-primary-foreground/20" : "bg-muted"
                      )}
                    >
                      {toPersianDigits(count)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Cron info footer */}
          <div className="p-3 border-t space-y-2">
            <div className="rounded-lg bg-muted/60 p-2.5 text-[11px] space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                زمان‌سنجی خودکار
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sun className="h-3 w-3 text-amber-500" />
                  صبحگاهی
                </span>
                <span className="nums-fa">۰۸:۰۰</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileBarChart className="h-3 w-3 text-primary" />
                  گزارش مدیر
                </span>
                <span className="nums-fa">۱۹:۰۰</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1 border-t">
                منطقه زمانی: Asia/Tehran
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/30 z-10 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="h-12 shrink-0 border-b bg-background px-4 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold">{currentNav?.label}</h1>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {currentNav?.desc}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-3 sm:p-4">
            {view === "overview" && <OverviewView onNewTask={() => setNewTaskOpen(true)} tasks={tasks} />}
            {view === "kanban" && (
              <KanbanView filters={filters} onNewTask={() => setNewTaskOpen(true)} />
            )}
            {view === "list" && (
              <TaskListView filters={filters} setFilters={setFilters} />
            )}
            {view === "bi" && <BIView />}
            {view === "reports" && <ReportsView />}
            {view === "mytasks" && <MyTasksView />}
            {view === "members" && <MembersView />}
          </div>
        </main>
      </div>

      <NewTaskDialog
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        onCreated={refreshAll}
      />
    </div>
  );
}
