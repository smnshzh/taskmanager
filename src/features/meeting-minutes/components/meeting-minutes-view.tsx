"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, MapPin, Plus, UserRound, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { priorityByKey, statusByKey } from "@/lib/constants";
import { formatJalaliLong, toPersianDigits } from "@/lib/jalali";
import type { MeetingMinutesResponse } from "../types";
import { MeetingMinuteForm } from "./meeting-minute-form";

async function loadMeetingMinutes(page: number): Promise<MeetingMinutesResponse> {
  const response = await fetch(`/api/meeting-minutes?page=${page}&limit=20`);
  if (!response.ok) throw new Error("MEETING_MINUTES_FETCH_FAILED");
  return response.json() as Promise<MeetingMinutesResponse>;
}

export function MeetingMinutesView() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = React.useState(false);
  const [formVersion, setFormVersion] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["meeting-minutes", page],
    queryFn: () => loadMeetingMinutes(page),
  });

  function created() {
    setPage(1);
    queryClient.invalidateQueries({ queryKey: ["meeting-minutes"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-52 w-full" />)}</div>;
  }

  const minutes = data?.data ?? [];
  const members = data?.meta.members ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{toPersianDigits(data?.meta.total ?? 0)} صورتجلسه ثبت‌شده</p>
          <p className="mt-1 text-xs text-muted-foreground">ثبت‌کننده دبیر جلسه است و مصوبات به تسک‌های قابل پیگیری تبدیل می‌شوند.</p>
        </div>
        <Button disabled={isError || members.length === 0} className="gap-1.5" onClick={() => { setFormVersion((version) => version + 1); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          صورتجلسه جدید
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive space-y-3">
          <p>دریافت صورتجلسه‌ها انجام نشد.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>تلاش دوباره</Button>
        </div>
      )}

      {!isError && minutes.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 opacity-30" />
          هنوز صورتجلسه‌ای ثبت نشده است.
        </div>
      )}

      <div className="space-y-4">
        {minutes.map((minute) => (
          <Card key={minute.id} className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-mono">{minute.code}</Badge>
                    <CardTitle className="text-base">{minute.title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{formatJalaliLong(new Date(minute.heldAt))}</span>
                    <span className="flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />دبیر: {minute.secretary.name}</span>
                    {minute.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{minute.location}</span>}
                  </div>
                </div>
                <Badge>{toPersianDigits(minute.decisions.length)} مصوبه</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 lg:grid-cols-2">
                <section className="rounded-lg border p-3">
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">دستور جلسه</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7">{minute.agenda}</p>
                </section>
                <section className="rounded-lg border p-3">
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">متن و شرح جلسه</h3>
                  <p className="whitespace-pre-wrap text-sm leading-7">{minute.notes || "—"}</p>
                </section>
              </div>

              <section>
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <UsersRound className="h-3.5 w-3.5" />
                  حاضرین
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {minute.attendees.map((attendee) => <Badge key={attendee.id} variant="secondary">{attendee.name}{attendee.groupName ? ` · ${attendee.groupName}` : ""}</Badge>)}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground">مصوبات و وضعیت مسئولان</h3>
                {minute.decisions.map((decision, index) => (
                  <div key={decision.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{toPersianDigits(index + 1)}</span>
                      <p className="flex-1 text-sm font-medium leading-6">{decision.text}</p>
                      <Badge variant="outline">{priorityByKey(decision.priority)?.label ?? decision.priority}</Badge>
                      <Badge variant="outline">مهلت: {formatJalaliLong(new Date(decision.deadline))}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {decision.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
                          <Badge variant="outline" className="font-mono text-[10px]">{task.code}</Badge>
                          <span className="min-w-0 flex-1 truncate">{task.assigneeName} · {task.groupName}</span>
                          <Badge variant={task.status === "DONE" ? "default" : "secondary"}>{statusByKey(task.status)?.label ?? task.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </CardContent>
          </Card>
        ))}
      </div>

      {(data?.meta.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>صفحه قبل</Button>
          <span className="text-xs text-muted-foreground">صفحه {toPersianDigits(page)} از {toPersianDigits(data?.meta.totalPages ?? 1)}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.meta.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>صفحه بعد</Button>
        </div>
      )}

      <MeetingMinuteForm key={formVersion} open={formOpen} onOpenChange={setFormOpen} members={members} onCreated={created} />
    </div>
  );
}
