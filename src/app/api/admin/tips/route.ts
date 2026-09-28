import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { systemTipSchema } from "@/lib/validations/tip.schema";
import { recordAdminAction } from "@/services/audit.service";
import { createSystemTip, listSystemTips } from "@/services/tips.service";

/** Mẫu mẹo tiết kiệm dùng chung cho mọi sinh viên (SRS 3.11). */
export const GET = handle(async () => {
  await requireAdmin();
  return ok(await listSystemTips());
});

export const POST = handle(async (req) => {
  const admin = await requireAdmin();
  const input = await parseBody(req, systemTipSchema);
  const tip = await createSystemTip(input);
  await recordAdminAction(admin.id, { action: "tip.create", targetType: "tip", targetId: tip.id, details: { title: input.title } });
  return ok(tip, { status: 201 });
});
