import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeMember } from "@/lib/serialize";

// GET /api/members
export async function GET() {
  const members = await db.member.findMany({
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  // Count active (non-done) tasks per member
  const activeCounts = await db.task.groupBy({
    by: ["assigneeId"],
    where: { status: { not: "DONE" } },
    _count: { _all: true },
  });
  const activeMap = new Map(activeCounts.map((a) => [a.assigneeId, a._count._all]));

  return NextResponse.json({
    members: members.map((m) => serializeMember(m, activeMap.get(m.id) ?? 0)),
  });
}
