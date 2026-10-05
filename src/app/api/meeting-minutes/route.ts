import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  createMeetingMinuteSchema,
  meetingMinuteListQuerySchema,
} from "@/features/meeting-minutes/schemas/meeting-minute.schema";
import {
  createMeetingMinute,
  getMeetingMinutes,
  MeetingMinuteServiceError,
} from "@/features/meeting-minutes/server/meeting-minute.service";

function response(body: unknown, status: number, requestId: string) {
  return NextResponse.json(body, {
    status,
    headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" },
  });
}

function errorResponse(error: unknown, requestId: string) {
  if (error instanceof MeetingMinuteServiceError) {
    return response({ error: { code: error.code, message: error.message } }, error.status, requestId);
  }
  const status = error instanceof Error && "status" in error
    ? Number((error as Error & { status?: number }).status) || 500
    : 500;
  if (status === 401) return response({ error: { code: "UNAUTHORIZED", message: "نشست نامعتبر است." } }, 401, requestId);
  if (status === 403) return response({ error: { code: "FORBIDDEN", message: "دسترسی کافی ندارید." } }, 403, requestId);
  console.error("Meeting minutes API error:", { requestId, error });
  return response({ error: { code: "INTERNAL_ERROR", message: "خطای سرور" } }, 500, requestId);
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  try {
    await requirePermission("meeting:view");
    const parsed = meetingMinuteListQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    if (!parsed.success) {
      return response({
        error: { code: "VALIDATION_ERROR", message: "پارامترهای فهرست معتبر نیست.", details: parsed.error.flatten() },
      }, 400, requestId);
    }
    return response(await getMeetingMinutes(parsed.data.page, parsed.data.limit), 200, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();
  try {
    const actor = await requirePermission("meeting:create");
    const parsed = createMeetingMinuteSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return response({
        error: { code: "VALIDATION_ERROR", message: "اطلاعات صورتجلسه معتبر نیست.", details: parsed.error.flatten() },
      }, 400, requestId);
    }
    const minute = await createMeetingMinute({ id: actor.id, name: actor.name }, parsed.data);
    return response({ data: minute, meta: { requestId } }, 201, requestId);
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
