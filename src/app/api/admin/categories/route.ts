import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { createCategorySchema } from "@/lib/validations/category.schema";
import { createDefaultCategory, listDefaultCategories } from "@/services/category.service";

export const GET = handle(async () => {
  await requireAdmin();
  return ok(await listDefaultCategories());
});

export const POST = handle(async (req) => {
  await requireAdmin();
  const input = await parseBody(req, createCategorySchema);
  return ok(await createDefaultCategory(input), { status: 201 });
});
