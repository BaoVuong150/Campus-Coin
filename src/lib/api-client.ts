import type { ErrorCode } from "@/lib/api/errors";

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode | "NETWORK_ERROR",
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const SESSION_CODES = new Set(["UNAUTHORIZED", "SESSION_EXPIRED", "ACCOUNT_DISABLED"]);
let redirecting = false;

function redirectToLogin(code: string) {
  if (redirecting || typeof window === "undefined") return;
  redirecting = true;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  const reason = code === "SESSION_EXPIRED" ? "expired" : code === "ACCOUNT_DISABLED" ? "disabled" : "required";
  const target = window.location.pathname.startsWith("/admin") ? "/admin/login" : "/login";
  window.location.replace(`${target}?reason=${reason}&next=${next}`);
}

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Không tự chuyển về trang đăng nhập khi 401 (dùng cho form đăng nhập). */
  skipAuthRedirect?: boolean;
}

/** Gọi API nội bộ, trả về `data` hoặc ném ApiClientError với thông báo thân thiện. */
export async function apiFetch<T>(url: string, { body, skipAuthRedirect, headers, ...init }: FetchOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: body !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiClientError(0, "NETWORK_ERROR", "Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // body rỗng hoặc không phải JSON
  }

  const data = payload as { success?: boolean; data?: T; error?: { code: ErrorCode; message: string; fields?: Record<string, string> } } | null;
  if (response.ok && data?.success) return data.data as T;

  const error = data?.error;
  const code = error?.code ?? "INTERNAL_ERROR";
  if (!skipAuthRedirect && response.status === 401 && SESSION_CODES.has(code)) redirectToLogin(code);
  if (!skipAuthRedirect && code === "ACCOUNT_DISABLED") redirectToLogin(code);
  throw new ApiClientError(response.status, code, error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại.", error?.fields);
}

