import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "فایل ارسال نشده" }, { status: 400 });
    }

    // تبدیل فایل به buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // خواندن Excel
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet);

    const results = [];

    for (const row of rows as any[]) {
      try {
        // ارسال به API خودت
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie: req.headers.get("cookie") || "", // حفظ session
          },
          body: JSON.stringify({
            title: row.title,
            description: row.description,
            assigneeId: row.assigneeId,
            priority: row.priority,
            deadline: row.deadline,
            startTime: row.startTime,
            groupId: row.groupId,
            source: row.source,
            link: row.link,
            letterNumber: row.letterNumber,
            letterDate: row.letterDate,
            refererId: row.refererId,
          }),
        });

        const data = await res.json();

        results.push({
          row,
          success: res.status === 201,
          error: data?.error || null,
        });
      } catch (e) {
        results.push({
          row,
          success: false,
          error: "خطای پردازش",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}