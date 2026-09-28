import { NextResponse } from "next/server";
import { handle } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { withSmartRetry } from "@/lib/database/resilience";

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export const GET = handle(async () => {
  await requireAdmin();

  // Lấy danh sách toàn bộ người dùng và số lượng giao dịch kèm cơ chế Smart Retry
  const users = await withSmartRetry(() =>
    prisma.user.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        academic_year: true,
        role: true,
        is_active: true,
        monthly_allowance_baseline: true,
        monthly_savings_goal: true,
        created_at: true,
        last_login_at: true,
        _count: {
          select: { transactions: true },
        },
      },
    })
  );

  const headers = [
    "Mã ID",
    "Họ và tên",
    "Email",
    "Niên khóa",
    "Vai trò",
    "Trạng thái",
    "Mức trợ cấp tháng (VND)",
    "Mục tiêu tiết kiệm (VND)",
    "Số giao dịch đã ghi",
    "Ngày tạo tài khoản",
    "Đăng nhập gần nhất",
  ];

  const rows = users.map((u) => [
    escapeCsvField(u.id),
    escapeCsvField(u.name),
    escapeCsvField(u.email),
    escapeCsvField(u.academic_year || "Chưa cập nhật"),
    escapeCsvField(u.role === "admin" ? "Quản trị viên" : "Sinh viên"),
    escapeCsvField(u.is_active ? "Hoạt động" : "Đã khóa"),
    escapeCsvField(u.monthly_allowance_baseline ? Number(u.monthly_allowance_baseline) : 0),
    escapeCsvField(u.monthly_savings_goal ? Number(u.monthly_savings_goal) : 0),
    escapeCsvField(u._count.transactions),
    escapeCsvField(u.created_at.toISOString()),
    escapeCsvField(u.last_login_at ? u.last_login_at.toISOString() : "Chưa đăng nhập"),
  ]);

  // Thêm UTF-8 BOM (\uFEFF) để Excel trên Windows/Mac tự động nhận diện tiếng Việt có dấu chuẩn 100%
  const csvContent =
    "\uFEFF" +
    headers.map((h) => `"${h}"`).join(",") +
    "\r\n" +
    rows.map((r) => r.join(",")).join("\r\n");

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const filename = `campuscoin_users_${dateStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
