import { NextResponse } from "next/server";
import { handle } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/database/prisma";
import { withSmartRetry } from "@/lib/database/resilience";
import { toCsv } from "@/lib/csv/escape";
import { recordAdminAction } from "@/services/audit.service";

export const GET = handle(async () => {
  const admin = await requireAdmin();

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
    u.id,
    u.name,
    u.email,
    u.academic_year || "Chưa cập nhật",
    u.role === "admin" ? "Quản trị viên" : "Sinh viên",
    u.is_active ? "Hoạt động" : "Đã khóa",
    Number(u.monthly_allowance_baseline ?? 0),
    Number(u.monthly_savings_goal ?? 0),
    u._count.transactions,
    u.created_at.toISOString(),
    u.last_login_at ? u.last_login_at.toISOString() : "Chưa đăng nhập",
  ]);

  // Mọi ô đi qua csvCell: chống CSV/formula injection (tên/email do người dùng tự nhập) và kèm BOM cho Excel.
  const csvContent = toCsv([headers, ...rows]);
  // Xuất dữ liệu cá nhân của toàn bộ user là thao tác nhạy cảm → ghi nhật ký.
  await recordAdminAction(admin.id, { action: "users.export", targetType: "users", details: { count: users.length } });

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
