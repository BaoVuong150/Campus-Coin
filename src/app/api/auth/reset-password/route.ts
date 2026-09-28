import { handle, ok, parseBody } from "@/lib/api/response";
import { AUTH_RATE_LIMIT, clientIp, rateLimit } from "@/lib/auth/rate-limit";
import { resetPasswordSchema } from "@/lib/validations/auth.schema";
import { resetPasswordWithToken } from "@/services/user.service";

/** Đặt mật khẩu mới từ link trong email. Không tự đăng nhập: user đăng nhập lại bằng mật khẩu mới. */
export const POST = handle(async (req) => {
  rateLimit(`reset:${clientIp(req)}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const { token, password } = await parseBody(req, resetPasswordSchema);
  await resetPasswordWithToken(token, password);
  return ok({ reset: true });
});
