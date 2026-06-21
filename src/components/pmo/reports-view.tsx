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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentBadge, PriorityBadge, StatusBadge, ReasonBadge } from "./badges";
import { TaskDetailSheet } from "./task-detail-sheet";
import type { SerializedTask } from "@/lib/serialize";
import {
  formatJalaliDate,
  formatTime,
  toPersianDigits,
  isOverdue,
} from "@/lib/jalali";
import { cn } from "@/lib/utils";
import {
  Sunrise,
  Moon,
  Send,
  CheckCircle2,
  Clock,
  AlertOctagon,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";

type MorningData = {
  date: string;
  time: string;
  briefings: {
    member: {
      id: string;
      name: string;
      handle: string;
      department: string;
      departmentLabel: string;
    };
    today: SerializedTask[];
    overdue: SerializedTask[];
  }[];
  totalActive: number;
  summaryNote: string;
};

type EveningData = {
  date: string;
  done: SerializedTask[];
  inProgress: SerializedTask[];
  notDone: SerializedTask[];
  obstacles: { key: string; label: string; count: number }[];
  byDept: {
    key: string;
    label: string;
    color: string;
    done: number;
    inProgress: number;
    blocked: number;
    pending: number;
    overdue: number;
  }[];
  stats: { doneCount: number; inProgressCount: number; notDoneCount: number; totalBlocked: number };
  obstacleSummary: string;
};

export function ReportsView() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = React.useState<SerializedTask | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const morning = useQuery({
    queryKey: ["report", "morning"],
    queryFn: async () => {
      const r = await fetch("/api/reports/morning");
      return (await r.json()) as MorningData;
    },
  });
  const evening = useQuery({
    queryKey: ["report", "evening"],
    queryFn: async () => {
      const r = await fetch("/api/reports/evening");
      return (await r.json()) as EveningData;
    },
  });

  function openTask(t: SerializedTask) {
    setSelected(t);
    setSheetOpen(true);
  }

  function simulateSend(type: "morning" | "evening") {
    toast.success(
      type === "morning"
        ? "🌅 پیام صبحگاهی برای همه اعضا ارسال شد. (شبیه‌سازی cron ۰۸:۰۰)"
        : "📊 گزارش پایان روز برای مدیر ارسال شد. (شبیه‌سازی cron ۱۹:۰۰)"
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="morning" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <TabsList>
            <TabsTrigger value="morning" className="gap-1.5">
              <Sunrise className="h-4 w-4" />
              گزارش صبحگاهی (۰۸:۰۰)
            </TabsTrigger>
            <TabsTrigger value="evening" className="gap-1.5">
              <Moon className="h-4 w-4" />
              گزارش پایان روز مدیر (۱۹:۰۰)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="morning" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full scroll-area-pmo">
            <div className="space-y-4 pb-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sunrise className="h-5 w-5 text-amber-500" />
                        🌅 گزارش کارهای روزانه
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {morning.data?.date} — پیام ساعت ۰۸:۰۰ به تفکیک کاربر
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => simulateSend("morning")}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      ارسال پیام
                    </Button>
                  </div>
                </CardHeader>
                {morning.data && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{morning.data.summaryNote}</p>
                  </CardContent>
                )}
              </Card>

              {morning.isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              )}

              {morning.data?.briefings.map((b) => (
                <Card key={b.member.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {b.member.name.charAt(0)}
                        </span>
                        <div>
                          <CardTitle className="text-base">{b.member.name}</CardTitle>
                          <CardDescription>
                            👤 بخش شما: {b.member.departmentLabel}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-md bg-amber-100 text-amber-700 px-2 py-0.5 nums-fa dark:bg-amber-950/40 dark:text-amber-300">
                          امروز: {toPersianDigits(b.today.length)}
                        </span>
                        <span className="rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 nums-fa dark:bg-rose-950/40 dark:text-rose-300">
                          عقب‌افتاده: {toPersianDigits(b.overdue.length)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {b.today.length === 0 && b.overdue.length === 0 && (
                      <p className="text-sm text-muted-foreground">تسک فعالی برای امروز ندارید.</p>
                    )}
                    {b.today.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">
                          📌 تسک‌های در دست اقدام امروز:
                        </p>
                        <div className="space-y-1.5">
                          {b.today.map((t, i) => (
                            <BriefingRow key={t.id} index={i + 1} task={t} onOpen={() => openTask(t)} />
                          ))}
                        </div>
                      </div>
                    )}
                    {b.overdue.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1.5">
                          🔴 تسک‌های عقب‌افتاده:
                        </p>
                        <div className="space-y-1.5">
                          {b.overdue.map((t, i) => (
                            <BriefingRow
                              key={t.id}
                              index={i + 1}
                              task={t}
                              overdue
                              onOpen={() => openTask(t)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t mt-2">
                      <span className="text-xs text-muted-foreground self-center ml-1">
                        👇 وضعیت خود را مشخص کنید:
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-sky-200 bg-sky-50 text-sky-700">
                        🟢 شروع کردم
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-200 bg-amber-50 text-amber-700">
                        🟡 در انتظار اطلاعات
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-rose-200 bg-rose-50 text-rose-700">
                        🔴 انجام نمی‌شود
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {morning.data && morning.data.briefings.length === 0 && (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    هیچ تسک فعالی برای امروز ثبت نشده است.
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="evening" className="flex-1 mt-0 data-[state=inactive]:hidden">
          <ScrollArea className="h-full scroll-area-pmo">
            <div className="space-y-4 pb-4">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Moon className="h-5 w-5 text-primary" />
                        📊 گزارش عملکرد واحد برنامه‌ریزی
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {evening.data?.date} — گزارش ساعت ۱۹:۰۰ ویژه مدیر
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => simulateSend("evening")}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                      ارسال به مدیر
                    </Button>
                  </div>
                </CardHeader>
                {evening.data && (
                  <CardContent className="pt-0 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatBox label="✅ انجام شده" value={evening.data.stats.doneCount} tone="emerald" />
                    <StatBox label="⏳ در جریان" value={evening.data.stats.inProgressCount} tone="sky" />
                    <StatBox label="❌ معوق" value={evening.data.stats.notDoneCount} tone="rose" />
                    <StatBox label="🚫 مسدود" value={evening.data.stats.totalBlocked} tone="amber" />
                  </CardContent>
                )}
              </Card>

              {evening.isLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              )}

              {evening.data && (
                <>
                  {/* Obstacle analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <AlertOctagon className="h-4 w-4 text-rose-500" />
                        🔍 تحلیل موانع (برای هوش تجاری)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                        {evening.data.obstacles.map((o) => (
                          <div key={o.key} className="rounded-lg border p-3 bg-muted/30 text-center">
                            <div className="text-xl font-bold nums-fa text-rose-600 dark:text-rose-400">
                              {toPersianDigits(o.count)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">{o.label}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        {evening.data.obstacleSummary}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Done */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                        ✅ انجام شده
                        <span className="text-muted-foreground text-sm nums-fa">
                          ({toPersianDigits(evening.data.done.length)} تسک)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {evening.data.done.length === 0 && <Empty text="تسکی امروز انجام نشده است." />}
                      {evening.data.done.map((t) => (
                        <ReportRow key={t.id} task={t} onOpen={() => openTask(t)} />
                      ))}
                    </CardContent>
                  </Card>

                  {/* In progress */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-sky-700 dark:text-sky-400">
                        <Clock className="h-5 w-5" />
                        ⏳ در جریان
                        <span className="text-muted-foreground text-sm nums-fa">
                          ({toPersianDigits(evening.data.inProgress.length)} تسک)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {evening.data.inProgress.length === 0 && <Empty text="تسکی در جریان نیست." />}
                      {evening.data.inProgress.map((t) => (
                        <ReportRow key={t.id} task={t} onOpen={() => openTask(t)} />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Not done */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base text-rose-700 dark:text-rose-400">
                        <AlertOctagon className="h-5 w-5" />
                        ❌ انجام نشده / معوق
                        <span className="text-muted-foreground text-sm nums-fa">
                          ({toPersianDigits(evening.data.notDone.length)} تسک)
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {evening.data.notDone.length === 0 && <Empty text="معوقی وجود ندارد." />}
                      {evening.data.notDone.map((t) => (
                        <ReportRow key={t.id} task={t} onOpen={() => openTask(t)} overdue />
                      ))}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <TaskDetailSheet
        task={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["report"] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }}
      />
    </div>
  );
}

function BriefingRow({
  index,
  task,
  overdue,
  onOpen,
}: {
  index: number;
  task: SerializedTask;
  overdue?: boolean;
  onOpen: () => void;
}) {
  const dl = new Date(task.deadline);
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-colors"
    >
      <span className="text-xs text-muted-foreground nums-fa w-5">{toPersianDigits(index)}.</span>
      {overdue && <span className="text-rose-500">🔴</span>}
      <span className="flex-1 line-clamp-1 font-medium">{task.title}</span>
      <PriorityBadge priority={task.priority} />
      <span className="text-xs text-muted-foreground nums-fa shrink-0">
        {toPersianDigits(formatTime(dl))}
      </span>
    </div>
  );
}

function ReportRow({
  task,
  overdue,
  onOpen,
}: {
  task: SerializedTask;
  overdue?: boolean;
  onOpen: () => void;
}) {
  const dl = new Date(task.deadline);
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-2 rounded-md border bg-card p-2 text-sm cursor-pointer hover:border-primary/40 hover:bg-muted/40 transition-colors"
    >
      {overdue && <span>🔴</span>}
      <span className="font-mono text-xs text-muted-foreground">{task.code}</span>
      <span className="flex-1 line-clamp-1">{task.title}</span>
      <DepartmentBadge department={task.department} />
      {task.followUpReason && <ReasonBadge reason={task.followUpReason} />}
      <StatusBadge status={task.status} />
      <span className="text-xs text-muted-foreground nums-fa shrink-0">
        {formatJalaliDate(dl)}
      </span>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: number; tone: "emerald" | "sky" | "rose" | "amber" }) {
  const toneClasses = {
    emerald: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
    sky: "text-sky-700 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400",
    rose: "text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
    amber: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  }[tone];
  return (
    <div className={cn("rounded-lg p-3", toneClasses)}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-2xl font-bold nums-fa mt-1">{toPersianDigits(value)}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground py-2">{text}</p>;
}
