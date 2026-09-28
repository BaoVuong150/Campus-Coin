import { z } from "zod";
import { handle, ok, parseBody, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { paginationSchema } from "@/lib/validations/common.schema";
import { listNotifications, markAllRead, markRead } from "@/services/notification.service";

const querySchema = paginationSchema.extend({ unread: z.enum(["true", "false"]).default("false") });

const markSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.number().int().positive()).min(1).max(100) }),
]);

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { page, pageSize, unread } = parseQuery(req, querySchema);
  return ok(await listNotifications(user.id, page, pageSize, unread === "true"));
});

export const PATCH = handle(async (req) => {
  const user = await requireAuth();
  const input = await parseBody(req, markSchema);
  const updated = "all" in input ? await markAllRead(user.id) : await markRead(user.id, input.ids);
  return ok({ updated });
});
