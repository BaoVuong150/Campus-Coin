import { handle, ok, parseBody } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validations/profile.schema";
import { getProfile, updateProfile } from "@/services/user.service";

export const GET = handle(async () => {
  const user = await requireAuth();
  return ok(await getProfile(user.id));
});

export const PATCH = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, updateProfileSchema);
  return ok(await updateProfile(user.id, input));
});
