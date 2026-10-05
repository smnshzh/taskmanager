import { z } from "zod";

const uniqueIds = (values: string[]) => new Set(values).size === values.length;
const isoDateTime = z.string().datetime({ offset: true });

export const meetingDecisionInputSchema = z.object({
  text: z.string().trim().min(1, "متن مصوبه الزامی است.").max(160, "متن مصوبه حداکثر ۱۶۰ کاراکتر است."),
  assigneeIds: z.array(z.string().trim().min(1)).min(1, "حداقل یک مسئول انتخاب کنید.").max(20)
    .refine(uniqueIds, "مسئول تکراری مجاز نیست."),
  deadline: isoDateTime,
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
});

export const createMeetingMinuteSchema = z.object({
  title: z.string().trim().min(1, "عنوان جلسه الزامی است.").max(160),
  heldAt: isoDateTime,
  location: z.string().trim().max(200).optional().nullable(),
  agenda: z.string().trim().min(1, "دستور جلسه الزامی است.").max(5_000),
  notes: z.string().trim().max(10_000).optional().nullable(),
  attendeeIds: z.array(z.string().trim().min(1)).min(1, "حداقل یک حاضر انتخاب کنید.").max(100)
    .refine(uniqueIds, "عضو تکراری در حاضرین مجاز نیست."),
  decisions: z.array(meetingDecisionInputSchema).min(1, "حداقل یک مصوبه ثبت کنید.").max(25),
}).superRefine((input, context) => {
  const heldAt = new Date(input.heldAt).getTime();
  const assignmentCount = input.decisions.reduce((total, decision) => total + decision.assigneeIds.length, 0);
  if (assignmentCount > 100) {
    context.addIssue({
      code: "custom",
      path: ["decisions"],
      message: "در هر صورتجلسه حداکثر ۱۰۰ تخصیص مسئول مجاز است.",
    });
  }
  input.decisions.forEach((decision, index) => {
    if (new Date(decision.deadline).getTime() <= heldAt) {
      context.addIssue({
        code: "custom",
        path: ["decisions", index, "deadline"],
        message: "مهلت مصوبه باید بعد از زمان جلسه باشد.",
      });
    }
  });
});

export const meetingMinuteListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateMeetingMinuteInput = z.infer<typeof createMeetingMinuteSchema>;
