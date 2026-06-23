import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeGroup } from "@/lib/serialize";
import { requireRole, isHttpError } from "@/lib/auth";

// GET /api/groups — SUPER_ADMIN and MANAGER can access
export async function GET() {
  try {
    const me = await requireRole("SUPER_ADMIN", "MANAGER");

    const groups = await db.orgGroup.findMany({
      include: {
        managers: { include: { member: true }, orderBy: { createdAt: "asc" } },
        _count: { select: { members: true, taskTemplates: true, tasks: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ groups: groups.map(serializeGroup) });
  } catch (error: unknown) {
    if (isHttpError(error, 401)) return NextResponse.json({ error: "نشست نامعتبر است." }, { status: 401 });
    if (isHttpError(error, 403)) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("Groups GET error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}

// POST /api/groups — SUPER_ADMIN only
// Body: { name, code, managerIds?: string[] }
export async function POST(req: NextRequest) {
  try {
    await requireRole("SUPER_ADMIN");
    const body = await req.json();
    const { name, code, managerIds } = body ?? {};

    if (!name || !code) {
      return NextResponse.json({ error: "نام و کد مجموعه الزامی است." }, { status: 400 });
    }

    const existing = await db.orgGroup.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "این کد مجموعه قبلاً ثبت شده است." }, { status: 400 });
    }

    // Validate manager IDs if provided
    const validManagerIds: string[] = [];
    if (Array.isArray(managerIds) && managerIds.length > 0) {
      const mgrs = await db.member.findMany({
        where: { id: { in: managerIds } },
        select: { id: true, role: true },
      });
      for (const mid of managerIds) {
        const mgr = mgrs.find((m) => m.id === mid);
        if (!mgr) {
          return NextResponse.json({ error: `عضو "${mid}" یافت نشد.` }, { status: 400 });
        }
        if (mgr.role !== "MANAGER") {
          return NextResponse.json({ error: "فقط کاربران با نقش «مدیر مجموعه» می‌توانند مدیر باشند." }, { status: 400 });
        }
        validManagerIds.push(mid);
      }
    }

    const group = await db.orgGroup.create({
      data: {
        name: String(name).trim(),
        code: String(code).trim(),
        managers: validManagerIds.length > 0 ? {
          create: validManagerIds.map((mid) => ({ memberId: mid })),
        } : undefined,
      },
      include: {
        managers: { include: { member: true }, orderBy: { createdAt: "asc" } },
        _count: { select: { members: true, taskTemplates: true, tasks: true } },
      },
    });

    return NextResponse.json({ group: serializeGroup(group) }, { status: 201 });
  } catch (error: unknown) {
    if (isHttpError(error, 401)) return NextResponse.json({ error: "نشست نامعتبر است." }, { status: 401 });
    if (isHttpError(error, 403)) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
    console.error("Groups POST error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}