import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { suggestBatchSchema } from "@/lib/validations/import.schema";
import { suggestCategories } from "@/services/category.service";

const BATCHES_PER_MINUTE = 10;

/** Gợi ý danh mục hàng loạt khi nhập CSV (chỉ dựa trên dữ liệu của chính user). */
export const POST = handle(async (req) => {
  const user = await requireAuth();
  rateLimit(`suggest-batch:${user.id}`, BATCHES_PER_MINUTE, 60_000);
  const { items } = await parseBody(req, suggestBatchSchema);
  return ok({ suggestions: await suggestCategories(user.id, items) });
});
