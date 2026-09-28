import { handle, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { listAdminAudits } from "@/services/audit.service";

/** Nhật ký thao tác quản trị gần nhất (chỉ admin). */
export const GET = handle(async () => {
  await requireAdmin();
  return ok(await listAdminAudits());
});
