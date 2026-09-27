import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getPointsSummary } from "@/services/points.service";

export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await getPointsSummary(user.id));
});
