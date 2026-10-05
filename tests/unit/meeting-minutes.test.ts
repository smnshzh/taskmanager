import { describe, expect, it } from "vitest";
import { createMeetingMinuteSchema } from "@/features/meeting-minutes/schemas/meeting-minute.schema";
import { sequenceCode } from "@/features/meeting-minutes/server/meeting-minute.service";

const validInput = {
  title: "جلسه هفتگی عملیات",
  heldAt: "2026-10-05T05:30:00.000Z",
  location: "اتاق جلسات",
  agenda: "بررسی کارهای باز",
  notes: "جمع‌بندی جلسه",
  attendeeIds: ["member-1", "member-2"],
  decisions: [{
    text: "گزارش فروش تهیه شود",
    assigneeIds: ["member-2", "member-3"],
    deadline: "2026-10-06T13:30:00.000Z",
    priority: "HIGH" as const,
  }],
};

describe("meeting minute input", () => {
  it("accepts a decision with multiple responsible members", () => {
    const result = createMeetingMinuteSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.decisions[0].assigneeIds).toHaveLength(2);
  });

  it("does not accept a client-supplied secretary", () => {
    const result = createMeetingMinuteSchema.parse({ ...validInput, secretaryId: "spoofed" });
    expect(result).not.toHaveProperty("secretaryId");
  });

  it("rejects duplicate attendees and assignees", () => {
    expect(createMeetingMinuteSchema.safeParse({
      ...validInput,
      attendeeIds: ["member-1", "member-1"],
    }).success).toBe(false);
    expect(createMeetingMinuteSchema.safeParse({
      ...validInput,
      decisions: [{ ...validInput.decisions[0], assigneeIds: ["member-2", "member-2"] }],
    }).success).toBe(false);
  });

  it("requires every decision deadline to follow the meeting time", () => {
    expect(createMeetingMinuteSchema.safeParse({
      ...validInput,
      decisions: [{ ...validInput.decisions[0], deadline: validInput.heldAt }],
    }).success).toBe(false);
  });

  it("caps task assignments in one meeting transaction", () => {
    const decisions = Array.from({ length: 6 }, (_, index) => ({
      ...validInput.decisions[0],
      text: `مصوبه ${index + 1}`,
      assigneeIds: Array.from({ length: 20 }, (__, assigneeIndex) => `member-${index}-${assigneeIndex}`),
    }));
    expect(createMeetingMinuteSchema.safeParse({ ...validInput, decisions }).success).toBe(false);
  });
});

describe("meeting and task codes", () => {
  it("creates padded codes and supports multiple tasks in one transaction", () => {
    expect(sequenceCode("MTG", 0)).toBe("MTG-0001");
    expect(sequenceCode("MTG", 99)).toBe("MTG-0100");
    expect(sequenceCode("TSK", 10, 1)).toBe("TSK-0012");
    expect(sequenceCode("TSK", 9_999)).toBe("TSK-10000");
  });
});
