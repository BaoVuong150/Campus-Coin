import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { AUTH_RATE_LIMIT, rateLimit } from "@/lib/auth/rate-limit";
import { changePasswordSchema } from "@/lib/validations/auth.schema";
import { changePassword } from "@/services/user.service";

export const POST = handle(async (req) => {
  const user = await requireAuth();
  rateLimit(`password:${user.id}`, AUTH_RATE_LIMIT.limit, AUTH_RATE_LIMIT.windowMs);
  const input = await parseBody(req, changePasswordSchema);
  await changePassword(user.id, input.currentPassword, input.newPassword);
  return ok({ changed: true });
});
