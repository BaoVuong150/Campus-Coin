import { handle, ok, parseBody } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { updateCategorySchema } from "@/lib/validations/category.schema";
import { deleteUserCategory, updateUserCategory } from "@/services/category.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await intParam(ctx);
  const input = await parseBody(req, updateCategorySchema);
  return ok(await updateUserCategory(user.id, id, input));
});

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const user = await requireAuth();
  await deleteUserCategory(user.id, await intParam(ctx));
  return ok({ deleted: true });
});
