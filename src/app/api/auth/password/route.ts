import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { startSession } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, rateLimit } from "@/lib/auth/rate-limit";
import { changePasswordSchema } from "@/lib/validations/auth.schema";
import { changePassword } from "@/services/user.service";

/** Đổi mật khẩu: các phiên trên thiết bị khác bị đăng xuất, thiết bị hiện tại nhận cookie phiên mới. */
export const POST = handle(async (req) => {
  // Được phép khi đang phải đổi mật khẩu tạm – đây chính là bước đổi mật khẩu.
  const user = await requireAuth({ allowPendingPasswordChange: true });
  await rateLimit(`password:${user.id}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const input = await parseBody(req, changePasswordSchema);
  const grant = await changePassword(user.id, input.currentPassword, input.newPassword);

  const response = ok({ changed: true });
  startSession(response, grant);
  return response;
});
