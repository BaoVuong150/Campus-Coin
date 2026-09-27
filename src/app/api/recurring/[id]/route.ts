import { handle, ok, parseBody } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { updateRecurringSchema } from "@/lib/validations/recurring.schema";
import { deleteRecurring, updateRecurring } from "@/services/recurring.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await uuidParam(ctx);
  const input = await parseBody(req, updateRecurringSchema);
  return ok(await updateRecurring(user.id, id, input));
});

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  await deleteRecurring(user.id, await uuidParam(ctx));
  return ok({ deleted: true });
});
