import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getPlanning } from "@/services/planning.service";

/** Safe-to-Spend + dự báo cuối tháng cho tháng hiện tại. */
export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await getPlanning(user.id));
});
