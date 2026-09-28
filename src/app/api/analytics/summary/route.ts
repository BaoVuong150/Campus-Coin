import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/utils/date";
import { budgetQuerySchema } from "@/lib/validations/budget.schema";
import { getSummary } from "@/services/analytics.service";

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { month } = parseQuery(req, budgetQuerySchema);
  return ok(await getSummary(user.id, month ?? currentMonthKey()));
});
