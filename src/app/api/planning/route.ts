import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getPlanning } from "@/services/planning.service";
import { ensureRecurringProcessed } from "@/services/scheduler";

/** Safe-to-Spend + dự báo cuối tháng cho tháng hiện tại. */
export const GET = handle(async () => {
  const user = await requireAuth();
  await ensureRecurringProcessed(user.id);
  return ok(await getPlanning(user.id));
});
