import { handle, ok, parseBody } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth/session";
import { updateCategorySchema } from "@/lib/validations/category.schema";
import { deleteDefaultCategory, updateDefaultCategory } from "@/services/category.service";
import { recordAdminAction } from "@/services/audit.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const admin = await requireAdmin();
  const id = await intParam(ctx);
  const input = await parseBody(req, updateCategorySchema);
  const category = await updateDefaultCategory(id, input);
  await recordAdminAction(admin.id, { action: "category.update", targetType: "category", targetId: id, details: { ...input } });
  return ok(category);
});

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const admin = await requireAdmin();
  const id = await intParam(ctx);
  await deleteDefaultCategory(id);
  await recordAdminAction(admin.id, { action: "category.delete", targetType: "category", targetId: id });
  return ok({ deleted: true });
});
