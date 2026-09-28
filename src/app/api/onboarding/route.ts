import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validations/onboarding.schema";
import { completeOnboarding } from "@/services/onboarding.service";

/** Hoàn tất (hoặc bỏ qua) thiết lập ban đầu sau khi đăng ký. */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, onboardingSchema);
  await completeOnboarding(user.id, input);
  return ok({ completed: true });
});
