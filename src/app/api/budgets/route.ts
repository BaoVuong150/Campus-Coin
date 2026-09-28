import { handle, ok, parseBody, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/utils/date";
import { budgetQuerySchema, upsertBudgetSchema } from "@/lib/validations/budget.schema";
import { getBudgetOverview, upsertBudget } from "@/services/budget.service";

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { month } = parseQuery(req, budgetQuerySchema);
  return ok(await getBudgetOverview(user.id, month ?? currentMonthKey()));
});

/** Tạo mới hoặc cập nhật hạn mức cho (danh mục, tháng). */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, upsertBudgetSchema);
  await upsertBudget(user.id, input);
  return ok(await getBudgetOverview(user.id, input.month));
});
