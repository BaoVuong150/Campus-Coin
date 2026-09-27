import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { suggestCategorySchema } from "@/lib/validations/category.schema";
import { suggestCategory } from "@/services/category.service";

const SUGGEST_LIMIT_PER_MINUTE = 120;

export const POST = handle(async (req) => {
  const user = await requireAuth();
  rateLimit(`suggest:${user.id}`, SUGGEST_LIMIT_PER_MINUTE, 60_000);
  const { text, type } = await parseBody(req, suggestCategorySchema);
  return ok({ suggestion: await suggestCategory(user.id, text, type) });
});
