import { handle, ok, parseBody } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth/session";
import { updateCategorySchema } from "@/lib/validations/category.schema";
import { deleteDefaultCategory, updateDefaultCategory } from "@/services/category.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  await requireAdmin();
  const id = await intParam(ctx);
  const input = await parseBody(req, updateCategorySchema);
  return ok(await updateDefaultCategory(id, input));
});

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  await requireAdmin();
  await deleteDefaultCategory(await intParam(ctx));
  return ok({ deleted: true });
});
