import { Errors } from "./errors";

export interface IdContext {
  params: Promise<{ id: string }>;
}

export async function intParam(ctx: IdContext): Promise<number> {
  const { id } = await ctx.params;
  const value = Number(id);
  if (!Number.isInteger(value) || value <= 0) throw Errors.badRequest("Mã không hợp lệ.");
  return value;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function uuidParam(ctx: IdContext): Promise<string> {
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) throw Errors.badRequest("Mã không hợp lệ.");
  return id;
}
