import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getInsights } from "@/services/analytics.service";

export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await getInsights(user.id));
});
