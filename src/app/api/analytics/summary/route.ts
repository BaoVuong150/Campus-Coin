import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/utils/date";
import { budgetQuerySchema } from "@/lib/validations/budget.schema";
import { getSummary } from "@/services/analytics.service";
import { ensureRecurringProcessed } from "@/services/scheduler";

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { month } = parseQuery(req, budgetQuerySchema);
  await ensureRecurringProcessed(user.id);
  return ok(await getSummary(user.id, month ?? currentMonthKey()));
});
