import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { announcementSchema } from "@/lib/validations/admin.schema";
import { announcementDedupeKey, broadcast } from "@/services/notification.service";
import { recordAdminAction } from "@/services/audit.service";

/** Gửi thông báo hệ thống tới toàn bộ sinh viên đang hoạt động (bấm gửi lặp lại không gửi trùng). */
export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  const { title, message } = await parseBody(req, announcementSchema);
  const sent = await broadcast(title, message, announcementDedupeKey(title, message));
  await recordAdminAction(admin.id, { action: "announcement.send", targetType: "announcement", details: { title, sent } });
  return ok({ sent });
});
