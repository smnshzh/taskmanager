import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeTask } from "@/lib/serialize";
import { DEPARTMENTS } from "@/lib/constants";

// GET /api/tasks?status=&department=&priority=&overdue=&assigneeId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const department = searchParams.get("department");
  const priority = searchParams.get("priority");
  const overdue = searchParams.get("overdue") === "1";
  const assigneeId = searchParams.get("assigneeId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (department) where.department = department;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const tasks = await db.task.findMany({
    where,
    include: { assignee: true },
    orderBy: { deadline: "asc" },
  });

  let result = tasks.map(serializeTask);
  if (overdue) {
    const now = Date.now();
    result = result.filter((t) => t.status !== "DONE" && new Date(t.deadline).getTime() < now);
  }

  return NextResponse.json({ tasks: result });
}

// POST /api/tasks — manager creates a new task
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, department, assigneeId, priority, deadline, link, description } = body ?? {};

  if (!title || !department || !assigneeId || !priority || !deadline) {
    return NextResponse.json(
      { error: "فیلدهای ضروری ناقص است. عنوان، بخش، مسئول، اولویت و ددلاین الزامی است." },
      { status: 400 }
    );
  }
  if (!DEPARTMENTS.some((d) => d.key === department)) {
    return NextResponse.json({ error: "بخش نامعتبر است." }, { status: 400 });
  }

  const assignee = await db.member.findUnique({ where: { id: assigneeId } });
  if (!assignee) {
    return NextResponse.json({ error: "مسئول یافت نشد." }, { status: 400 });
  }

  // Generate next code
  const count = await db.task.count();
  const code = `TSK-${String(count + 1).padStart(4, "0")}`;

  const task = await db.task.create({
    data: {
      code,
      title: String(title).trim(),
      description: description ?? null,
      department,
      assigneeId,
      priority,
      deadline: new Date(deadline),
      link: link ?? null,
      status: "PENDING",
    },
    include: { assignee: true },
  });

  await db.followUpLog.create({
    data: {
      taskId: task.id,
      type: "STATUS_CHANGE",
      message: `تسک توسط مدیر در حالت «در صف انجام» ثبت شد.`,
    },
  });

  return NextResponse.json({ task: serializeTask(task) });
}
