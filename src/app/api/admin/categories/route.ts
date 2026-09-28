import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createCategorySchema } from "@/lib/validations/category.schema";
import { createDefaultCategory, listDefaultCategories } from "@/services/category.service";
import { recordAdminAction } from "@/services/audit.service";

export const GET = handle(async () => {
  await requireAdmin();
  return ok(await listDefaultCategories());
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  const input = await parseBody(req, createCategorySchema);
  const category = await createDefaultCategory(input);
  await recordAdminAction(admin.id, { action: "category.create", targetType: "category", targetId: category.id, details: { ...input } });
  return ok(category, { status: 201 });
});
