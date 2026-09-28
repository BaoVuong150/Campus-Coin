import { handle, ok } from "@/lib/api/response";
import { startSession } from "@/lib/auth/cookies";
import { AUTH_RATE_LIMIT, rateLimit } from "@/lib/auth/rate-limit";
import { requireAuth } from "@/lib/auth/session";
import { signOutAllDevices } from "@/services/user.service";

/** DELETE: đăng xuất khỏi mọi thiết bị khác; thiết bị hiện tại nhận cookie phiên mới. */
export const DELETE = handle(async () => {
  const user = await requireAuth();
  await rateLimit(`sessions:${user.id}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const grant = await signOutAllDevices(user.id);
  const response = ok({ revoked: true });
  startSession(response, grant);
  return response;
});
