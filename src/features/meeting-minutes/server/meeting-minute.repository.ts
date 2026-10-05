import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const meetingMemberSelect = {
  id: true,
  name: true,
  handle: true,
  groupId: true,
  group: { select: { name: true } },
} satisfies Prisma.MemberSelect;

export const meetingMinuteSelect = {
  id: true,
  code: true,
  title: true,
  heldAt: true,
  location: true,
  agenda: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  secretary: { select: meetingMemberSelect },
  attendees: {
    orderBy: { member: { name: "asc" as const } },
    select: { member: { select: meetingMemberSelect } },
  },
  decisions: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      text: true,
      deadline: true,
      priority: true,
      tasks: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true,
          code: true,
          status: true,
          assigneeId: true,
          assignee: { select: { name: true } },
          group: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.MeetingMinuteSelect;

export type MeetingMinuteRecord = Prisma.MeetingMinuteGetPayload<{
  select: typeof meetingMinuteSelect;
}>;

export async function listMeetingMinutes(page: number, limit: number) {
  const [minutes, total, members] = await Promise.all([
    db.meetingMinute.findMany({
      select: meetingMinuteSelect,
      orderBy: [{ heldAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.meetingMinute.count(),
    db.member.findMany({
      where: { isActive: true },
      select: meetingMemberSelect,
      orderBy: { name: "asc" },
    }),
  ]);
  return { minutes, total, members };
}

export function findActiveMembers(tx: Prisma.TransactionClient, memberIds: string[]) {
  return tx.member.findMany({
    where: { id: { in: memberIds }, isActive: true },
    select: meetingMemberSelect,
  });
}

export async function findLastMeetingSequence(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<Array<{ value: number }>>(Prisma.sql`
    SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 5) AS INTEGER)), 0)::INTEGER AS "value"
    FROM "MeetingMinute"
    WHERE "code" ~ '^MTG-[0-9]+$'
  `);
  return rows[0]?.value ?? 0;
}

export async function findLastTaskSequence(tx: Prisma.TransactionClient) {
  const rows = await tx.$queryRaw<Array<{ value: number }>>(Prisma.sql`
    SELECT COALESCE(MAX(CAST(SUBSTRING("code" FROM 5) AS INTEGER)), 0)::INTEGER AS "value"
    FROM "Task"
    WHERE "code" ~ '^TSK-[0-9]+$'
  `);
  return rows[0]?.value ?? 0;
}

export function createMeetingBase(
  tx: Prisma.TransactionClient,
  data: Prisma.MeetingMinuteCreateInput,
) {
  return tx.meetingMinute.create({ data, select: { id: true, code: true, title: true } });
}

export function createMeetingDecision(
  tx: Prisma.TransactionClient,
  data: Prisma.MeetingDecisionUncheckedCreateInput,
) {
  return tx.meetingDecision.create({ data, select: { id: true } });
}

export function getMeetingMinuteById(tx: Prisma.TransactionClient, id: string) {
  return tx.meetingMinute.findUniqueOrThrow({ where: { id }, select: meetingMinuteSelect });
}
