import { describe, expect, it } from "vitest";
import { parseAssistantTaskDraft } from "@/features/assistant/server/task-draft.service";

describe("assistant task draft", () => {
  it("parses a fenced JSON task draft and preserves the Tehran offset", () => {
    const draft = parseAssistantTaskDraft(`\`\`\`json
{
  "title": "تهیه گزارش فروش",
  "deadline": "2026-09-28T14:00:00+03:30",
  "priority": "HIGH"
}
\`\`\``);

    expect(draft).toEqual({
      title: "تهیه گزارش فروش",
      deadline: new Date("2026-09-28T14:00:00+03:30"),
      priority: "HIGH",
    });
  });

  it("rejects prose that does not contain a valid task draft", () => {
    expect(() => parseAssistantTaskDraft("مهلت مشخص نیست")).toThrow("پیش‌نویس معتبر");
  });

  it("rejects invalid priorities", () => {
    expect(() => parseAssistantTaskDraft('{"title":"گزارش","deadline":"2026-09-28T14:00:00+03:30","priority":"URGENT"}'))
      .toThrow("عنوان، مهلت یا اولویت");
  });
});
