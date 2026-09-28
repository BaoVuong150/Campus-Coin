import { handle, ok } from "@/lib/api/response";
import { intParam, type IdContext } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth/session";
import { recordAdminAction } from "@/services/audit.service";
import { deleteSystemTip } from "@/services/tips.service";

export const DELETE = handle<IdContext>(async (_req, ctx) => {
  const admin = await requireAdmin();
  const id = await intParam(ctx);
  await deleteSystemTip(id);
  await recordAdminAction(admin.id, { action: "tip.delete", targetType: "tip", targetId: id });
  return ok({ deleted: true });
});
