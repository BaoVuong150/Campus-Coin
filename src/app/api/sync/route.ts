import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { syncUserData } from "@/services/scheduler";

/**
 * Đồng bộ khi mở app: sinh giao dịch định kỳ đến hạn + cộng điểm kỳ đã kết thúc.
 * Là POST vì có ghi dữ liệu; các API GET (tổng quan, giao dịch, kế hoạch, điểm) chỉ đọc.
 */
export const POST = handle(async () => {
  const user = await requireAuth();
  return ok(await syncUserData(user.id));
});
