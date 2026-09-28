import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { tipActionSchema } from "@/lib/validations/tip.schema";
import { listSavingTips, setTipState } from "@/services/tips.service";

/** Mẹo tiết kiệm cá nhân hóa, xếp theo số tiền có thể tiết kiệm (mẹo đã ghim lên đầu). */
export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await listSavingTips(user.id));
});

/** Ghim / bỏ ghim / bỏ qua / khôi phục một mẹo. */
export const PATCH = handle(async (req) => {
  const user = await requireAuth();
  const { key, action } = await parseBody(req, tipActionSchema);
  await setTipState(user.id, key, action);
  return ok({ updated: true });
});
