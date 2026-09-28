import { handle, ok } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth/session";
import { resetUserPassword } from "@/services/admin.service";
import { recordAdminAction } from "@/services/audit.service";

/**
 * Admin đặt lại mật khẩu cho một tài khoản: sinh mật khẩu tạm, trả về DUY NHẤT một lần trong response
 * để admin chuyển cho người dùng. Mọi phiên đăng nhập cũ của tài khoản đó mất hiệu lực ngay.
 */
export const POST = handle<IdContext>(async (_req, ctx) => {
  const admin = await requireAdmin();
  const id = await uuidParam(ctx);
  const result = await resetUserPassword(admin.id, id);
  // Không bao giờ ghi mật khẩu tạm vào nhật ký.
  await recordAdminAction(admin.id, { action: "user.reset_password", targetType: "user", targetId: id });
  return ok(result, { headers: { "Cache-Control": "no-store" } });
});
