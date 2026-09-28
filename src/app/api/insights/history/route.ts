import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { listInsightHistory } from "@/services/tips.service";

/** Nhận định các tháng trước (mục đã đánh dấu lên đầu). */
export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await listInsightHistory(user.id));
});
