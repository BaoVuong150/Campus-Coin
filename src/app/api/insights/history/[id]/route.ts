import { handle, ok, parseBody } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAuth } from "@/lib/auth/session";
import { insightPinSchema } from "@/lib/validations/tip.schema";
import { setInsightPinned } from "@/services/tips.service";

/** Đánh dấu / bỏ đánh dấu nhận định của một tháng để xem lại sau. */
export const PATCH = handle<IdContext>(async (req, ctx) => {
  const user = await requireAuth();
  const id = await intParam(ctx);
  const { pinned } = await parseBody(req, insightPinSchema);
  await setInsightPinned(user.id, id, pinned);
  return ok({ updated: true });
});
