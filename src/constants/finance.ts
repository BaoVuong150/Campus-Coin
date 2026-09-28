export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Giới hạn số tiền: cột DB là Decimal(12, 2) nên giá trị tối đa phải < 10 tỷ. */
export const MAX_AMOUNT = 9_999_999_999;
/** Số tiền lưu tối đa 2 chữ số thập phân (khớp Decimal(12, 2)). */
export const AMOUNT_DECIMALS = 2;
/** Khoảng năm hợp lệ cho mọi ngày người dùng nhập (chặn năm 0001 / 9999 làm lệch báo cáo). */
export const MIN_DATE_YEAR = 2000;
export const MAX_DATE_YEAR = 2100;
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

