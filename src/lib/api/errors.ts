export type ErrorCode =
  | "UNAUTHORIZED"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "ACCOUNT_DISABLED"
  | "PASSWORD_CHANGE_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "EMAIL_TAKEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "TRANSACTION_NOT_FOUND"
  | "CATEGORY_NOT_FOUND"
  | "BUDGET_NOT_FOUND"
  | "GOAL_NOT_FOUND"
  | "RECURRING_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "CONFLICT"
  | "CATEGORY_IN_USE"
  | "INSUFFICIENT_GOAL_BALANCE"
  | "GOAL_HAS_HISTORY"
  | "RATE_LIMITED"
  | "EMAIL_UNAVAILABLE"
  | "INVALID_JSON"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const Errors = {
  unauthorized: () => new ApiError(401, "UNAUTHORIZED", "Vui lòng đăng nhập để tiếp tục."),
  sessionExpired: () => new ApiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
  forbidden: () => new ApiError(403, "FORBIDDEN", "Bạn không có quyền thực hiện thao tác này."),
  passwordChangeRequired: () =>
    new ApiError(403, "PASSWORD_CHANGE_REQUIRED", "Bạn cần đổi mật khẩu tạm thời trước khi tiếp tục."),
  accountDisabled: () => new ApiError(403, "ACCOUNT_DISABLED", "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên."),
  notFound: (code: ErrorCode, message: string) => new ApiError(404, code, message),
  conflict: (code: ErrorCode, message: string) => new ApiError(409, code, message),
  badRequest: (message: string, fields?: Record<string, string>) =>
    new ApiError(400, "VALIDATION_ERROR", message, fields),
  rateLimited: (retryAfterSec: number) =>
    new ApiError(429, "RATE_LIMITED", `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSec} giây.`),
};
