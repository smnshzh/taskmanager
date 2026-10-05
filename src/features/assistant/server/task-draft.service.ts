import { z } from "zod";
import { askBarakaAssistant, AssistantClientError } from "./baraka-assistant.client";

const taskDescriptionSchema = z.string().trim().min(3).max(512);
const rawTaskDraftSchema = z.object({
  title: z.string().trim().min(1).max(160),
  deadline: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export type AssistantTaskDraft = {
  title: string;
  deadline: Date;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

function tehranDateTime(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")} ${value("hour")}:${value("minute")}`;
}

function jsonPayload(reply: string): string {
  const fenced = reply.match(/```(?:json)?\s*([\s\S]*?)```/iu)?.[1];
  if (fenced) return fenced.trim();
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  return start >= 0 && end > start ? reply.slice(start, end + 1) : reply;
}

export function parseAssistantTaskDraft(reply: string): AssistantTaskDraft {
  let json: unknown;
  try {
    json = JSON.parse(jsonPayload(reply));
  } catch {
    throw new AssistantClientError("دستیار نتوانست پیش‌نویس معتبر تسک بسازد.", "INVALID_RESPONSE");
  }
  const parsed = rawTaskDraftSchema.safeParse(json);
  if (!parsed.success) {
    throw new AssistantClientError("عنوان، مهلت یا اولویت استخراج‌شده معتبر نبود.", "INVALID_RESPONSE");
  }
  const deadline = new Date(parsed.data.deadline);
  if (!Number.isFinite(deadline.getTime())) {
    throw new AssistantClientError("مهلت استخراج‌شده معتبر نبود.", "INVALID_RESPONSE");
  }
  return { title: parsed.data.title.replace(/\s+/g, " "), deadline, priority: parsed.data.priority };
}

export async function createTaskDraftFromText(description: string, now = new Date()): Promise<AssistantTaskDraft> {
  const parsedDescription = taskDescriptionSchema.safeParse(description);
  if (!parsedDescription.success) {
    throw new AssistantClientError("شرح تسک باید بین ۳ تا ۵۱۲ کاراکتر باشد.", "INVALID_MESSAGE");
  }
  const prompt = [
    "فقط یک JSON معتبر و بدون توضیح یا Markdown برگردان.",
    "متن کاربر را به پیش‌نویس تسک تبدیل کن.",
    "قالب دقیق: {\"title\":\"string\",\"deadline\":\"ISO-8601 with +03:30\",\"priority\":\"HIGH|MEDIUM|LOW\"}.",
    `زمان فعلی تهران ${tehranDateTime(now)} است. اگر ساعت گفته نشده، ساعت 17:00 تهران را بگذار.`,
    `متن کاربر: ${parsedDescription.data}`,
  ].join("\n");
  const draft = parseAssistantTaskDraft(await askBarakaAssistant(prompt));
  if (draft.deadline.getTime() <= now.getTime()) {
    throw new AssistantClientError("مهلت استخراج‌شده گذشته است؛ تاریخ آینده را صریح‌تر بنویسید.", "INVALID_RESPONSE");
  }
  return draft;
}
