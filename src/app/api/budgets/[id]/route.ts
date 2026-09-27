import { handle, ok, parseBody } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { updateBudgetSchema } from "@/lib/validations/budget.schema";
import { deleteBudget, updateBudgetLimit } from "@/services/budget.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await intParam(ctx);
  const { limit_amount } = await parseBody(req, updateBudgetSchema);
  await updateBudgetLimit(user.id, id, limit_amount);
  return ok({ updated: true });
});

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  await deleteBudget(user.id, await intParam(ctx));
  return ok({ deleted: true });
});
