import { z } from "zod";
import { handle, ok, parseBody, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { createCategorySchema } from "@/lib/validations/category.schema";
import { createUserCategory, listCategories } from "@/services/category.service";

const querySchema = z.object({ type: z.enum(["income", "expense"]).optional() });

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { type } = parseQuery(req, querySchema);
  return ok(await listCategories(user.id, type));
});

/** Tạo danh mục cá nhân. Danh mục hệ thống chỉ tạo qua /api/admin/categories. */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, createCategorySchema);
  return ok(await createUserCategory(user.id, input), { status: 201 });
});
