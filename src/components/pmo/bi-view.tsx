"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toPersianDigits } from "@/lib/jalali";
import { cn } from "@/lib/utils";
import { PieChart as PieIcon, BarChart3, Grid3x3, TrendingUp, AlertTriangle } from "lucide-react";

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
  weeklyDone: { week: string; label: string; value: number }[];
  hourBuckets: { key: string; label: string }[];
  heatmapRows: {
    day: string;
    cells: { bucket: string; bucketLabel: string; value: number }[];
  }[];
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

const COLOR_MAP: Record<string, string> = {
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
};

export function BIView() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard/stats");
      return (await r.json()) as Stats;
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    );
  }

  const maxHeat = Math.max(
    1,
    ...data.heatmapRows.flatMap((r) => r.cells.map((c) => c.value))
  );

  const totalOverdue = data.overdueByDept.reduce((a, b) => a + b.value, 0);

  return (
    <ScrollArea className="h-full scroll-area-pmo">
      <div className="space-y-4 pb-4">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="کل تسک‌ها"
            value={data.totals.all}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="slate"
          />
          <KpiCard
            label="انجام‌شده"
            value={data.totals.DONE}
            icon={<TrendingUp className="h-4 w-4" />}
            tone="emerald"
          />
          <KpiCard
            label="مسدود شده"
            value={data.totals.BLOCKED}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="rose"
          />
          <KpiCard
            label="عقب‌افتاده"
            value={data.totals.overdue}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pie: overdue by department */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieIcon className="h-4 w-4 text-primary" />
                سهم هر بخش از تسک‌های معوق
              </CardTitle>
              <CardDescription>
                توزیع تسک‌های عقب‌افتاده (غیر انجام‌شده و گذشته از ددلاین) بر اساس بخش.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalOverdue === 0 ? (
                <EmptyChart text="معوقی وجود ندارد 🎉" />
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.overdueByDept}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={2}
                      >
                        {data.overdueByDept.map((entry) => (
                          <Cell key={entry.key} fill={COLOR_MAP[entry.color] ?? "#64748b"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${toPersianDigits(v)} تسک`, "تعداد"]}
                        contentStyle={{ direction: "rtl", fontFamily: "inherit", borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2 w-full">
                    {data.overdueByDept.map((d) => (
                      <div key={d.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ background: COLOR_MAP[d.color] }}
                          />
                          <span>{d.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="nums-fa font-medium">
                            {toPersianDigits(d.value)}
                          </span>
                          <span className="text-xs text-muted-foreground nums-fa">
                            ({toPersianDigits(
                              totalOverdue > 0 ? Math.round((d.value / totalOverdue) * 100) : 0
                            )}٪)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar: weekly done trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-primary" />
                روند بهره‌وری — تسک‌های انجام‌شده هفتگی
              </CardTitle>
              <CardDescription>
                مقایسه تعداد تسک‌های تکمیل‌شده در ۸ هفته اخیر.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.weeklyDone} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    className="nums-fa"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    className="nums-fa"
                  />
                  <Tooltip
                    formatter={(v: number) => [`${toPersianDigits(v)} تسک`, "انجام‌شده"]}
                    contentStyle={{ direction: "rtl", fontFamily: "inherit", borderRadius: 8 }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} name="انجام‌شده" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Heatmap: delay by weekday x hour */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Grid3x3 className="h-4 w-4 text-primary" />
                هیت‌مپ تاخیرها — روز هفته و بازه ساعتی
              </CardTitle>
              <CardDescription>
                نشان می‌دهد کدام روزهای هفته و کدام بازه‌های ساعتی، بیشترین تاخیر در
                ددلاین تسک‌ها رخ داده است (بر اساس ددلاین تسک‌های عقب‌افتاده).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  {/* header */}
                  <div className="grid grid-cols-[100px_repeat(4,1fr)] gap-1 mb-1">
                    <div />
                    {data.hourBuckets.map((b) => (
                      <div
                        key={b.key}
                        className="text-center text-xs text-muted-foreground py-1"
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                  {data.heatmapRows.map((row) => (
                    <div
                      key={row.day}
                      className="grid grid-cols-[100px_repeat(4,1fr)] gap-1 mb-1"
                    >
                      <div className="text-xs font-medium flex items-center px-2">
                        {row.day}
                      </div>
                      {row.cells.map((cell) => {
                        const intensity = cell.value / maxHeat;
                        return (
                          <div
                            key={cell.bucket}
                            className="aspect-[3/1.2] rounded-md flex items-center justify-center text-xs font-medium transition-all hover:ring-2 hover:ring-primary/40 cursor-default relative group"
                            style={{
                              background:
                                cell.value === 0
                                  ? "oklch(0.96 0.01 160)"
                                  : `oklch(${0.55 + intensity * 0.15} ${0.18 * intensity} 27)`,
                              color: cell.value === 0 ? "oklch(0.6 0.01 160)" : "white",
                            }}
                            title={`${row.day} • ${cell.bucketLabel}: ${toPersianDigits(cell.value)} تسک عقب‌افتاده`}
                          >
                            <span className="nums-fa">{toPersianDigits(cell.value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                    <span>کمتر</span>
                    <div className="flex gap-0.5">
                      {[0, 0.25, 0.5, 0.75, 1].map((i) => (
                        <div
                          key={i}
                          className="h-3 w-6 rounded-sm"
                          style={{
                            background:
                              i === 0
                                ? "oklch(0.96 0.01 160)"
                                : `oklch(${0.55 + i * 0.15} ${0.18 * i} 27)`,
                          }}
                        />
                      ))}
                    </div>
                    <span>بیشتر</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Obstacle analysis */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                تحلیل موانع (هوش تجاری)
              </CardTitle>
              <CardDescription>
                تحلیل علت‌های عدم انجام تسک‌های مسدود، برای شناسایی ریشه مشکلات واحد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {data.obstacles.map((o) => {
                  const total = data.obstacles.reduce((a, b) => a + b.value, 0);
                  const pct = total > 0 ? Math.round((o.value / total) * 100) : 0;
                  return (
                    <div
                      key={o.key}
                      className="rounded-lg border p-3 text-center bg-muted/30"
                    >
                      <div className="text-2xl font-bold nums-fa text-rose-600 dark:text-rose-400">
                        {toPersianDigits(o.value)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 leading-5">
                        {o.label}
                      </div>
                      <div className="text-xs nums-fa mt-1 text-muted-foreground">
                        {toPersianDigits(pct)}٪
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                💡 بینش: بیشترین مانع واحد{" "}
                <span className="font-bold">
                  {
                    [...data.obstacles].sort((a, b) => b.value - a.value)[0]?.label
                  }
                </span>{" "}
                است. این تحلیل به مدیر کمک می‌کند ببیند مشکل اصلی واحد کجاست.
              </div>
            </CardContent>
          </Card>

          {/* Department summary table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">خلاصه عملکرد به تفکیک بخش</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-right text-xs text-muted-foreground border-b">
                      <th className="py-2 font-medium">بخش</th>
                      <th className="py-2 font-medium text-center">کل</th>
                      <th className="py-2 font-medium text-center">انجام‌شده</th>
                      <th className="py-2 font-medium text-center">فعال</th>
                      <th className="py-2 font-medium text-center">مسدود</th>
                      <th className="py-2 font-medium text-center">عقب‌افتاده</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deptSummary.map((d) => (
                      <tr key={d.key} className="border-b last:border-0">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ background: COLOR_MAP[d.color] }}
                            />
                            <span className="font-medium">{d.label}</span>
                          </div>
                        </td>
                        <td className="text-center nums-fa">{toPersianDigits(d.total)}</td>
                        <td className="text-center nums-fa text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(d.done)}
                        </td>
                        <td className="text-center nums-fa text-sky-600 dark:text-sky-400">
                          {toPersianDigits(d.active)}
                        </td>
                        <td className="text-center nums-fa text-rose-600 dark:text-rose-400">
                          {toPersianDigits(d.blocked)}
                        </td>
                        <td className="text-center nums-fa font-medium text-rose-600 dark:text-rose-400">
                          {toPersianDigits(d.overdue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "slate" | "emerald" | "rose" | "amber";
}) {
  const toneClasses = {
    slate: "text-slate-600 bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400",
    rose: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("h-7 w-7 rounded-md flex items-center justify-center", toneClasses)}>
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold nums-fa">{toPersianDigits(value)}</div>
    </Card>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
      {text}
    </div>
  );
}
