import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeTask, serializeLog } from "@/lib/serialize";
import { STATUSES, FOLLOW_UP_REASONS } from "@/lib/constants";

// PATCH /api/tasks/[id]
// body: { status?, followUpReason?, startedAt?, doneAt? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status, followUpReason } = body ?? {};

  const existing = await db.task.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (status && STATUSES.some((s) => s.key === status)) {
    data.status = status;
    if (status === "STARTED" && !existing.startedAt) data.startedAt = new Date();
    if (status === "DONE") data.doneAt = new Date();
    if (status !== "BLOCKED") data.followUpReason = null;
  }
  if (followUpReason && FOLLOW_UP_REASONS.some((r) => r.key === followUpReason)) {
    data.followUpReason = followUpReason;
    data.status = "BLOCKED";
  }

  const updated = await db.task.update({
    where: { id },
    data,
    include: { assignee: true },
  });

  // Log the change
  if (status && status !== existing.status) {
    const statusLabel = STATUSES.find((s) => s.key === status)?.label ?? status;
    await db.followUpLog.create({
      data: {
        taskId: id,
        type: "STATUS_CHANGE",
        message: `وضعیت به «${statusLabel}» تغییر یافت.`,
      },
    });
  }
  if (followUpReason) {
    const reasonLabel =
      FOLLOW_UP_REASONS.find((r) => r.key === followUpReason)?.label ?? followUpReason;
    await db.followUpLog.create({
      data: {
        taskId: id,
        type: "END_OF_DAY_REASON",
        message: `علت عدم انجام: ${reasonLabel}`,
        reason: followUpReason,
      },
    });
  }

  const logs = await db.followUpLog.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ task: serializeTask(updated), logs: logs.map(serializeLog) });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const task = await db.task.findUnique({
    where: { id },
    include: { assignee: true, logs: { orderBy: { createdAt: "desc" }, take: 30 } },
  });
  if (!task) return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
  return NextResponse.json({
    task: serializeTask(task),
    logs: task.logs.map(serializeLog),
  });
}
