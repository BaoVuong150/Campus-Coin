import { handle, ok, parseBody } from "@/lib/api/response";
import { startSession } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, clientIp, rateLimit, resetRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth.schema";
import { logEvent } from "@/lib/observability/log";
import { authenticate } from "@/services/user.service";

export const POST = handle(async (req) => {
  const input = await parseBody(req, loginSchema);
  const key = `login:${clientIp(req)}:${input.email}`;
  // Header X-Forwarded-For có thể bị giả mạo, nên giới hạn thêm theo riêng email (không phụ thuộc IP)
  // để không thể dò mật khẩu một tài khoản bằng cách đổi IP giả.
  const emailKey = `login-email:${input.email}`;
  try {
    await rateLimit(key, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
    await rateLimit(emailKey, AUTH_RATE_LIMIT.limit * 3, AUTH_RATE_LIMIT.windowMs);
  } catch (error) {
    // Dấu hiệu dò mật khẩu hàng loạt – ghi sự kiện (không ghi email/IP) để giám sát.
    logEvent("warn", "auth.login_rate_limited", { portal: input.portal });
    throw error;
  }

  const grant = await authenticate(input);
  await resetRateLimit(key);
  await resetRateLimit(emailKey);

  const response = ok({ user: grant.user });
  startSession(response, grant);
  return response;
});
