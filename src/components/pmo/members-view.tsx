"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DepartmentBadge } from "./badges";
import type { SerializedMember } from "@/lib/serialize";
import { toPersianDigits } from "@/lib/jalali";
import { DEPARTMENTS } from "@/lib/constants";
import { Crown, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const deptColorDot: Record<string, string> = {
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function MembersView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const r = await fetch("/api/members");
      return (await r.json()) as { members: SerializedMember[] };
    },
  });

  const members = data?.members ?? [];
  const manager = members.find((m) => m.role === "MANAGER");
  const staff = members.filter((m) => m.role === "MEMBER");

  // group by department
  const byDept = DEPARTMENTS.map((d) => ({
    ...d,
    members: staff.filter((m) => m.department === d.key),
  }));

  return (
    <ScrollArea className="h-full scroll-area-pmo" onPointerEnter={() => queryClient.invalidateQueries({ queryKey: ["members"] })}>
      <div className="space-y-4 pb-4">
        {/* Manager card */}
        {manager && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Crown className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{manager.name}</h3>
                  <span className="rounded-md bg-primary text-primary-foreground px-2 py-0.5 text-xs">
                    مدیر واحد
                  </span>
                </div>
                <p className="text-sm text-muted-foreground" dir="ltr">
                  {manager.handle}
                </p>
              </div>
              <div className="text-left text-sm">
                <div className="text-muted-foreground text-xs">دسترسی</div>
                <div className="font-medium">ثبت تسک، گزارش‌گیری</div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        )}

        {/* By department */}
        {byDept.map((dept) => (
          <div key={dept.key}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", deptColorDot[dept.color])} />
              <h3 className="font-semibold">{dept.label}</h3>
              <span className="text-xs text-muted-foreground nums-fa">
                {toPersianDigits(dept.members.length)} نفر
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dept.members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {m.name.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{m.name}</div>
                        <div className="text-xs text-muted-foreground" dir="ltr">
                          {m.handle}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-md bg-muted/50 py-2">
                        <div className="text-lg font-bold nums-fa">
                          {toPersianDigits(m.taskCount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">کل تسک‌ها</div>
                      </div>
                      <div className="rounded-md bg-amber-50 py-2 dark:bg-amber-950/30">
                        <div className="text-lg font-bold nums-fa text-amber-700 dark:text-amber-400">
                          {toPersianDigits(m.activeCount)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">فعال</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dept.members.length === 0 && (
                <Card className="sm:col-span-2 lg:col-span-4">
                  <CardContent className="py-6 text-center text-muted-foreground text-sm">
                    <UserCircle2 className="h-8 w-8 mx-auto mb-1 opacity-50" />
                    عضوی در این بخش ثبت نشده است.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
