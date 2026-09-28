import { handle, ok, parseBody } from "@/lib/api/response";
import { uuidParam, type IdContext } from "@/lib/api/params";
import { requireAdmin } from "@/lib/auth/session";
import { adminUpdateUserSchema } from "@/lib/validations/admin.schema";
import { updateUser } from "@/services/admin.service";

export const PATCH = handle<IdContext>(async (req, ctx) => {
  const admin = await requireAdmin();
  const id = await uuidParam(ctx);
  const input = await parseBody(req, adminUpdateUserSchema);
  return ok(await updateUser(admin.id, id, input));
});
