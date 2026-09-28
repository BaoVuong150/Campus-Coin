import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError, Errors, type ErrorCode } from "./errors";
import { ConfigurationError } from "@/lib/env";
import { errorSummary, logEvent } from "@/lib/observability/log";

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true as const, data }, init);
}

export function fail(error: ApiError): NextResponse<ApiFailure> {
  return NextResponse.json(
    { success: false as const, error: { code: error.code, message: error.message, fields: error.fields } },
    { status: error.status }
  );
}

export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

/** Chuẩn hóa mọi lỗi ném ra từ route handler thành response thống nhất, không lộ stack trace. */
export function toErrorResponse(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ApiError) return fail(error);
  if (error instanceof ZodError) {
    const fields = zodFields(error);
    return fail(Errors.badRequest(Object.values(fields)[0] ?? "Dữ liệu không hợp lệ.", fields));
  }
  if (error instanceof ConfigurationError) {
    console.error("[config]", error.message);
    return fail(new ApiError(500, "CONFIGURATION_ERROR", "Máy chủ chưa được cấu hình đúng."));
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002: trùng unique; P2003: vi phạm khóa ngoại (dữ liệu đang được tham chiếu);
    // P2025: bản ghi đã bị xóa giữa lúc kiểm tra và lúc ghi (race) → 404 thay vì 500.
    if (error.code === "P2002") return fail(new ApiError(409, "CONFLICT", "Dữ liệu đã tồn tại."));
    if (error.code === "P2003") return fail(new ApiError(409, "CONFLICT", "Dữ liệu đang được sử dụng, không thể thực hiện."));
    if (error.code === "P2025") return fail(new ApiError(404, "NOT_FOUND", "Không tìm thấy dữ liệu."));
  }
  // Chi tiết lỗi chỉ ghi ở log server, không bao giờ trả về client.
  logEvent("error", "api.unexpected_error", { reason: errorSummary(error) });
  console.error(error);
  return fail(new ApiError(500, "INTERNAL_ERROR", "Đã có lỗi xảy ra. Vui lòng thử lại."));
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Chống CSRF lớp thứ hai (cookie đã SameSite=Lax): request ghi dữ liệu do trình duyệt gửi từ origin khác bị từ chối.
 * Request không có header Origin (cron, curl, server-to-server) không mang cookie của trình duyệt nên không bị ảnh hưởng.
 */
export function assertSameOrigin(req: Request): void {
  if (SAFE_METHODS.has(req.method)) return;
  if (req.headers.get("sec-fetch-site") === "cross-site") throw Errors.forbidden();
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw Errors.forbidden();
  }
  if (originHost !== host) throw Errors.forbidden();
}

export function handle<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      assertSameOrigin(req);
      return await fn(req, ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Dữ liệu gửi lên không hợp lệ.");
  }
  return schema.parse(raw);
}

export function parseQuery<T>(req: Request, schema: ZodType<T>): T {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}
