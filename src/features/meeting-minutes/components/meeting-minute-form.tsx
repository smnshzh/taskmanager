"use client";

import * as React from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/jalali-date-picker";
import { PRIORITIES } from "@/lib/constants";
import { useTMStore } from "@/lib/pmo-store";
import { tehranLocalDateTimeToUtc } from "@/shared/lib/date/tehran-time";
import type { MeetingMemberOption } from "../types";

type DecisionDraft = {
  key: string;
  text: string;
  assigneeIds: string[];
  deadlineDate: string;
  deadlineTime: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

function tehranDate(daysFromToday = 0) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + daysFromToday * 86_400_000));
}

let decisionSequence = 0;
function emptyDecision(): DecisionDraft {
  decisionSequence += 1;
  return {
    key: `decision-${decisionSequence}`,
    text: "",
    assigneeIds: [],
    deadlineDate: tehranDate(1),
    deadlineTime: "17:00",
    priority: "MEDIUM",
  };
}

function tehranIso(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return tehranLocalDateTimeToUtc(year, month, day, hour, minute).toISOString();
}

function apiError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return "ثبت صورتجلسه انجام نشد.";
  const error = (payload as { error?: unknown }).error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
  return "ثبت صورتجلسه انجام نشد.";
}

export function MeetingMinuteForm({
  open,
  onOpenChange,
  members,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: MeetingMemberOption[];
  onCreated: () => void;
}) {
  const currentMember = useTMStore((state) => state.member);
  const [title, setTitle] = React.useState("");
  const [heldDate, setHeldDate] = React.useState(() => tehranDate());
  const [heldTime, setHeldTime] = React.useState("09:00");
  const [location, setLocation] = React.useState("");
  const [agenda, setAgenda] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [attendeeIds, setAttendeeIds] = React.useState<string[]>(() => currentMember ? [currentMember.id] : []);
  const [decisions, setDecisions] = React.useState<DecisionDraft[]>(() => [emptyDecision()]);
  const [busy, setBusy] = React.useState(false);

  const memberOptions = React.useMemo(
    () => members.map((member) => ({
      value: member.id,
      label: `${member.name} (${member.handle})${member.groupName ? ` — ${member.groupName}` : ""}`,
    })),
    [members],
  );

  function updateDecision(key: string, patch: Partial<DecisionDraft>) {
    setDecisions((items) => items.map((item) => item.key === key ? { ...item, ...patch } : item));
  }

  function validate() {
    if (!title.trim()) return "عنوان جلسه الزامی است.";
    if (!heldDate || !heldTime) return "تاریخ و ساعت جلسه الزامی است.";
    if (!agenda.trim()) return "دستور جلسه الزامی است.";
    if (attendeeIds.length === 0) return "حداقل یک حاضر انتخاب کنید.";
    for (const [index, decision] of decisions.entries()) {
      if (!decision.text.trim()) return `متن مصوبه ${index + 1} الزامی است.`;
      if (decision.assigneeIds.length === 0) return `حداقل یک مسئول برای مصوبه ${index + 1} انتخاب کنید.`;
      if (!decision.deadlineDate || !decision.deadlineTime) return `مهلت مصوبه ${index + 1} الزامی است.`;
    }
    return null;
  }

  async function submit() {
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/meeting-minutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          heldAt: tehranIso(heldDate, heldTime),
          location: location.trim() || null,
          agenda: agenda.trim(),
          notes: notes.trim() || null,
          attendeeIds,
          decisions: decisions.map((decision) => ({
            text: decision.text.trim(),
            assigneeIds: decision.assigneeIds,
            deadline: tehranIso(decision.deadlineDate, decision.deadlineTime),
            priority: decision.priority,
          })),
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(apiError(payload));
        return;
      }
      toast.success("صورتجلسه و تسک‌های مصوبات ثبت شدند.");
      onOpenChange(false);
      onCreated();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent dir="rtl" className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="text-right">
          <DialogTitle>ثبت صورتجلسه جدید</DialogTitle>
          <DialogDescription>
            شما به‌صورت خودکار دبیر جلسه هستید. هر مصوبه برای هر مسئول، یک تسک قابل پیگیری می‌سازد.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="meeting-title">عنوان جلسه *</Label>
            <Input id="meeting-title" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder="مثلاً جلسه هفتگی عملیات" />
          </div>
          <div className="space-y-1.5">
            <Label>تاریخ جلسه *</Label>
            <JalaliDatePicker value={heldDate} onChange={setHeldDate} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-time">ساعت جلسه *</Label>
            <Input id="meeting-time" type="time" value={heldTime} onChange={(event) => setHeldTime(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="meeting-location">محل جلسه</Label>
            <Input id="meeting-location" value={location} maxLength={200} onChange={(event) => setLocation(event.target.value)} placeholder="حضوری، اتاق جلسه یا آنلاین" />
          </div>
          <div className="space-y-1.5">
            <Label>دبیر جلسه</Label>
            <Input value={currentMember?.name ?? ""} disabled />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>حاضرین *</Label>
            <MultiSelect options={memberOptions} value={attendeeIds} onValueChange={setAttendeeIds} placeholder="انتخاب حاضرین" searchPlaceholder="جستجوی نام یا هندل..." className="w-full" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="meeting-agenda">دستور جلسه *</Label>
            <Textarea id="meeting-agenda" value={agenda} maxLength={5000} onChange={(event) => setAgenda(event.target.value)} placeholder="موضوعات و دستورهای جلسه را بنویسید..." className="min-h-24" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="meeting-notes">متن و شرح جلسه</Label>
            <Textarea id="meeting-notes" value={notes} maxLength={10000} onChange={(event) => setNotes(event.target.value)} placeholder="جمع‌بندی گفتگوها و نکات جلسه..." className="min-h-28" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">مصوبات و تسک‌ها</h3>
              <p className="text-xs text-muted-foreground">برای هر مصوبه مسئول یا مسئولان و زمان انجام را مشخص کنید.</p>
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => setDecisions((items) => [...items, emptyDecision()])}>
              <Plus className="h-4 w-4" />
              افزودن مصوبه
            </Button>
          </div>

          {decisions.map((decision, index) => (
            <div key={decision.key} className="rounded-lg border bg-muted/20 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">مصوبه {index + 1}</span>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={decisions.length === 1} onClick={() => setDecisions((items) => items.filter((item) => item.key !== decision.key))} aria-label={`حذف مصوبه ${index + 1}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`decision-${decision.key}`}>متن تسک/مصوبه *</Label>
                <Input id={`decision-${decision.key}`} value={decision.text} maxLength={160} onChange={(event) => updateDecision(decision.key, { text: event.target.value })} placeholder="خروجی قابل انجام و روشن مصوبه" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>مسئول یا مسئولان *</Label>
                  <MultiSelect options={memberOptions} value={decision.assigneeIds} onValueChange={(assigneeIds) => updateDecision(decision.key, { assigneeIds })} placeholder="انتخاب مسئولان" className="w-full" />
                </div>
                <div className="space-y-1.5">
                  <Label>تاریخ انجام *</Label>
                  <JalaliDatePicker value={decision.deadlineDate} onChange={(deadlineDate) => updateDecision(decision.key, { deadlineDate })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`deadline-time-${decision.key}`}>ساعت انجام *</Label>
                  <Input id={`deadline-time-${decision.key}`} type="time" value={decision.deadlineTime} onChange={(event) => updateDecision(decision.key, { deadlineTime: event.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>اولویت</Label>
                  <Select value={decision.priority} onValueChange={(priority: "HIGH" | "MEDIUM" | "LOW") => updateDecision(decision.key, { priority })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRIORITIES.map((priority) => <SelectItem key={priority.key} value={priority.key}>{priority.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>انصراف</Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            ثبت صورتجلسه و تسک‌ها
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
