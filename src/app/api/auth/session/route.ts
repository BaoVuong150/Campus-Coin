import { handle, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";

export const GET = handle(async () => ok({ user: await requireAuth({ allowPendingPasswordChange: true }) }));
