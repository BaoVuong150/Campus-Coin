import { randomUUID } from "node:crypto";
import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { announcementSchema } from "@/lib/validations/admin.schema";
import { broadcast } from "@/services/notification.service";

/** Gửi thông báo hệ thống tới toàn bộ sinh viên đang hoạt động. */
export const POST = handle(async (req) => {
  await requireAdmin();
  const { title, message } = await parseBody(req, announcementSchema);
  return ok({ sent: await broadcast(title, message, `announcement:${randomUUID()}`) });
});
