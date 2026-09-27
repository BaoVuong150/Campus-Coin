export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const MAX_AMOUNT = 10_000_000_000;
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_NAME_LENGTH = 80;

/** Ngưỡng % ngân sách chuyển sang cảnh báo. */
export const BUDGET_WARNING_PERCENT = 80;
export const BUDGET_EXCEEDED_PERCENT = 100;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const RECENT_TRANSACTIONS_LIMIT = 6;

export const RECURRING_FREQUENCIES = ["weekly", "monthly", "yearly"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];
export const RECURRING_STATUSES = ["active", "paused", "cancelled"] as const;
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

export const GOAL_STATUSES = ["active", "completed", "archived"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const NOTIFICATION_KINDS = [
  "budget_warning",
  "budget_exceeded",
  "recurring",
  "goal",
  "unusual",
  "system",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Giao dịch bất thường: vượt mean + k·σ, hoặc gấp N lần trung bình danh mục. */
export const ANOMALY_STD_MULTIPLIER = 2;
export const ANOMALY_CATEGORY_MULTIPLIER = 3;
/** Cần tối thiểu bấy nhiêu mẫu lịch sử mới đánh giá bất thường, tránh báo động giả. */
export const ANOMALY_MIN_SAMPLES = 5;

export const PASSWORD_MIN_LENGTH = 8;

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Hàng tuần",
  monthly: "Hàng tháng",
  yearly: "Hàng năm",
};

export const RECURRING_STATUS_LABELS: Record<RecurringStatus, string> = {
  active: "Đang chạy",
  paused: "Tạm dừng",
  cancelled: "Đã hủy",
};
