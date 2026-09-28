import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export type AdminAction =
  | "user.update"
  | "user.reset_password"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "announcement.send"
  | "users.export"
  | "tip.create"
  | "tip.delete";

interface AdminAuditInput {
  action: AdminAction;
  targetType: "user" | "category" | "announcement" | "users" | "tip";
  targetId?: string | number | null;
  details?: Prisma.InputJsonObject;
}

let missingTableWarned = false;

/**
 * Ghi nhật ký thao tác quản trị. Best-effort: lỗi ghi nhật ký (ví dụ DB chưa chạy migration tạo bảng
 * admin_audits) không làm hỏng thao tác chính, chỉ ghi cảnh báo phía server. Không bao giờ lưu mật khẩu.
 */
export async function recordAdminAction(actorId: string, input: AdminAuditInput): Promise<void> {
  try {
    await prisma.adminAudit.create({
      data: {
        actor_id: actorId,
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId === undefined || input.targetId === null ? null : String(input.targetId),
        details: input.details,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      if (!missingTableWarned) console.warn("[audit] Bảng admin_audits chưa tồn tại – hãy chạy `npx prisma migrate deploy`.");
      missingTableWarned = true;
      return;
    }
    console.error("[audit] Không ghi được nhật ký quản trị", error);
  }
}

export interface AdminAuditDTO {
  id: number;
  actorId: string;
  actorName: string | null;
  action: AdminAction;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

/** Nhật ký gần nhất kèm tên admin thực hiện. Trả về rỗng nếu bảng chưa được tạo. */
export async function listAdminAudits(limit = 30): Promise<AdminAuditDTO[]> {
  try {
    const rows = await prisma.adminAudit.findMany({ orderBy: { created_at: "desc" }, take: limit });
    const actors = await prisma.user.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.actor_id))] } },
      select: { id: true, name: true },
    });
    const names = new Map(actors.map((a) => [a.id, a.name]));
    return rows.map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      actorName: names.get(r.actor_id) ?? null,
      action: r.action as AdminAction,
      targetType: r.target_type,
      targetId: r.target_id,
      details: r.details && typeof r.details === "object" && !Array.isArray(r.details) ? (r.details as Record<string, unknown>) : null,
      createdAt: r.created_at.toISOString(),
    }));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") return [];
    throw error;
  }
}
