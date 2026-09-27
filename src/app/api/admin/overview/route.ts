import { handle, ok } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminOverview } from "@/services/admin.service";

export const GET = handle(async () => {
  await requireAdmin();
  return ok(await getAdminOverview());
});
