import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { enqueueTaskAssigned } from "@/features/notifications/server/notification.events";
import type { CreateMeetingMinuteInput } from "../schemas/meeting-minute.schema";
import type { MeetingMemberOption, MeetingMinuteSummary } from "../types";
import {
  createMeetingBase,
  createMeetingDecision,
  findActiveMembers,
  findLastMeetingSequence,
  findLastTaskSequence,
  getMeetingMinuteById,
  listMeetingMinutes,
  type MeetingMinuteRecord,
} from "./meeting-minute.repository";

export class MeetingMinuteServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MeetingMinuteServiceError";
  }
}

export function sequenceCode(prefix: "MTG" | "TSK", lastSequence: number, offset = 0) {
  return `${prefix}-${String(lastSequence + 1 + offset).padStart(4, "0")}`;
}

function memberOption(member: {
  id: string;
  name: string;
  handle: string;
  groupId: string | null;
  group: { name: string } | null;
}): MeetingMemberOption {
  return {
    id: member.id,
    name: member.name,
    handle: member.handle,
    groupId: member.groupId,
    groupName: member.group?.name ?? null,
  };
}

export function serializeMeetingMinute(record: MeetingMinuteRecord): MeetingMinuteSummary {
  return {
    id: record.id,
    code: record.code,
    title: record.title,
    heldAt: record.heldAt.toISOString(),
    location: record.location,
    agenda: record.agenda,
    notes: record.notes,
    secretary: memberOption(record.secretary),
    attendees: record.attendees.map(({ member }) => memberOption(member)),
    decisions: record.decisions.map((decision) => ({
      id: decision.id,
      text: decision.text,
      deadline: decision.deadline.toISOString(),
      priority: decision.priority as "HIGH" | "MEDIUM" | "LOW",
      tasks: decision.tasks.map((task) => ({
        id: task.id,
        code: task.code,
        status: task.status,
        assigneeId: task.assigneeId,
        assigneeName: task.assignee.name,
        groupName: task.group.name,
      })),
    })),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getMeetingMinutes(page: number, limit: number) {
  const result = await listMeetingMinutes(page, limit);
  return {
    data: result.minutes.map(serializeMeetingMinute),
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
      members: result.members.map(memberOption),
    },
  };
}

type MeetingActor = { id: string; name: string };

function isRetryableTransactionError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError
    && (error.code === "P2002" || error.code === "P2034");
}

export async function createMeetingMinute(actor: MeetingActor, input: CreateMeetingMinuteInput) {
  const attendeeIds = Array.from(new Set([actor.id, ...input.attendeeIds]));
  const assigneeIds = input.decisions.flatMap((decision) => decision.assigneeIds);
  const requiredMemberIds = Array.from(new Set([...attendeeIds, ...assigneeIds]));
  const heldAt = new Date(input.heldAt);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const record = await db.$transaction(async (tx) => {
        const members = await findActiveMembers(tx, requiredMemberIds);
        if (members.length !== requiredMemberIds.length) {
          throw new MeetingMinuteServiceError(
            "یکی از حاضرین یا مسئولان انتخاب‌شده فعال نیست.",
            "MEETING_MEMBER_INVALID",
            400,
          );
        }
        const memberMap = new Map(members.map((member) => [member.id, member]));
        for (const assigneeId of assigneeIds) {
          if (!memberMap.get(assigneeId)?.groupId) {
            throw new MeetingMinuteServiceError(
              "همه مسئولان مصوبات باید عضو یک مجموعه باشند.",
              "MEETING_ASSIGNEE_GROUP_REQUIRED",
              400,
            );
          }
        }

        const [lastMeetingSequence, lastTaskSequence] = await Promise.all([
          findLastMeetingSequence(tx),
          findLastTaskSequence(tx),
        ]);
        const meeting = await createMeetingBase(tx, {
          code: sequenceCode("MTG", lastMeetingSequence),
          title: input.title,
          heldAt,
          location: input.location || null,
          agenda: input.agenda,
          notes: input.notes || null,
          secretary: { connect: { id: actor.id } },
          attendees: {
            create: attendeeIds.map((memberId) => ({ member: { connect: { id: memberId } } })),
          },
        });

        let taskOffset = 0;
        for (const decisionInput of input.decisions) {
          const deadline = new Date(decisionInput.deadline);
          const decision = await createMeetingDecision(tx, {
            meetingMinuteId: meeting.id,
            text: decisionInput.text,
            deadline,
            priority: decisionInput.priority,
          });

          for (const assigneeId of decisionInput.assigneeIds) {
            const assignee = memberMap.get(assigneeId)!;
            const task = await tx.task.create({
              data: {
                code: sequenceCode("TSK", lastTaskSequence, taskOffset),
                title: decisionInput.text,
                description: `مصوبه صورتجلسه ${meeting.code}: ${meeting.title}`,
                groupId: assignee.groupId!,
                assigneeId,
                creatorId: actor.id,
                priority: decisionInput.priority,
                deadline,
                status: "PENDING",
                source: "MEETING",
                meetingDecisionId: decision.id,
              },
              select: {
                id: true,
                code: true,
                title: true,
                assigneeId: true,
                deadline: true,
                updatedAt: true,
              },
            });
            taskOffset += 1;
            await tx.followUpLog.create({
              data: {
                taskId: task.id,
                type: "STATUS_CHANGE",
                message: `تسک از مصوبه صورتجلسه ${meeting.code} توسط ${actor.name} ثبت شد.`,
              },
            });
            await enqueueTaskAssigned(tx, {
              taskId: task.id,
              taskCode: task.code,
              title: task.title,
              memberId: task.assigneeId,
              actorName: actor.name,
              deadline: task.deadline,
              updatedAt: task.updatedAt,
            });
          }
        }

        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "MEETING_MINUTE_CREATED",
            entityType: "MeetingMinute",
            entityId: meeting.id,
            result: "SUCCESS",
            metadata: {
              attendeeCount: attendeeIds.length,
              decisionCount: input.decisions.length,
              taskCount: taskOffset,
            },
          },
        });

        return getMeetingMinuteById(tx, meeting.id);
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      return serializeMeetingMinute(record);
    } catch (error) {
      if (error instanceof MeetingMinuteServiceError) throw error;
      if (isRetryableTransactionError(error)) {
        if (attempt < 4) continue;
        break;
      }
      throw error;
    }
  }

  throw new MeetingMinuteServiceError(
    "ثبت صورتجلسه به‌دلیل تداخل هم‌زمان انجام نشد؛ دوباره تلاش کنید.",
    "MEETING_CREATE_CONFLICT",
    409,
  );
}
