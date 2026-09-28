import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/session";
import { adminUserQuerySchema } from "@/lib/validations/admin.schema";
import { listUsers } from "@/services/admin.service";

export const GET = handle(async (req) => {
  await requireAdmin();
  return ok(await listUsers(parseQuery(req, adminUserQuerySchema)));
});
