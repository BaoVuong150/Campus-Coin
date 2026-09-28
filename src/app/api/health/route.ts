import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";

/**
 * Health check cho giám sát uptime: trạng thái app + kết nối DB. Không trả biến môi trường, phiên bản hay lỗi chi tiết.
 * 200 khi mọi thứ ổn, 503 khi DB không phản hồi.
 */
export async function GET() {
  let database: "ok" | "down" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }
  const status = database === "ok" ? "ok" : "degraded";
  return NextResponse.json(
    { status, database, timestamp: new Date().toISOString() },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
