import type {
  GoalStatus,
  NotificationKind,
  RecurringFrequency,
  RecurringStatus,
  TransactionType,
} from "@/constants/finance";
import type { BudgetHealth } from "@/lib/finance/budget";
import type { NextMonthForecast } from "@/lib/finance/forecast";
import type { FinancialInsight } from "@/lib/finance/insights";
import type { TipTemplate } from "@/i18n/templates";

export type { TransactionType, FinancialInsight, BudgetHealth };

export interface CategoryDTO {
  id: number;
  name: string;
  type: TransactionType;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface TransactionDTO {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string;
  categoryId: number;
  category: CategoryDTO;
  suggestedCategoryId: number | null;
  recurringId: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionWarnings {
  duplicate: { id: string; date: string } | null;
  unusual: { typicalAmount: number } | null;
}

export interface CategorySuggestion {
  categoryId: number;
  categoryName: string;
  type: TransactionType;
  source: "preference" | "history" | "rule" | "default";
}

export interface BudgetItemDTO {
  id: number;
  month: string;
  categoryId: number;
  category: CategoryDTO;
  limit: number;
  spent: number;
  remaining: number;
  overBy: number;
  percentage: number;
  status: BudgetHealth;
}

export interface BudgetOverviewDTO {
  month: string;
  items: BudgetItemDTO[];
  totals: { limit: number; spent: number; remaining: number; percentage: number };
}

export interface SummaryDTO {
  month: string;
  balance: number;
  income: number;
  expense: number;
  previousIncome: number;
  previousExpense: number;
  /** Số dư cuối tháng trước (để so sánh số dư). */
  previousBalance: number;
  budget: { limit: number; remaining: number; percentage: number } | null;
}

/** key: "YYYY-MM-DD" (theo ngày) hoặc "YYYY-MM" (theo tháng); nhãn hiển thị do client dịch. */
export interface CashFlowPoint {
  key: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: number;
  name: string;
  color: string | null;
  icon: string | null;
  amount: number;
  percentage: number;
}

export interface PlanningDTO {
  month: string;
  /** false khi user chưa có giao dịch nào – UI hiển thị trạng thái trống thay vì con số 0 / cảnh báo thiếu hụt. */
  hasActivity: boolean;
  remainingDays: number;
  currentBalance: number;
  remainingFixedExpenses: number;
  expectedIncome: number;
  goalReserved: number;
  savingsTarget: number;
  monthlySavingsGoal?: number;
  budgetRemaining: number | null;
  safeToSpend: {
    spendable: number;
    daily: number;
    dailyByBalance: number;
    dailyByBudget: number | null;
    limitedBy: "balance" | "budget";
    status: "healthy" | "tight" | "negative";
  };
  forecast: {
    dailyPace: number;
    paceSource: "current_month" | "history" | "none";
    variableSpentThisMonth: number;
    projectedVariableSpend: number;
    projectedEndBalance: number;
    shortfall: number;
    /** Số ngày có dữ liệu giao dịch làm cơ sở dự báo. */
    dataDays: number;
    confidence: "insufficient" | "low" | "medium" | "high";
  };
  upcomingFixed: { id: string; name: string; amount: number; date: string; type: TransactionType }[];
  /** Dự báo tháng kế tiếp; null khi chưa đủ dữ liệu chi tiêu (dưới 7 ngày). */
  nextMonth: ({ month: string; basisDays: number } & NextMonthForecast) | null;
}

export interface RecurringDTO {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  frequency: RecurringFrequency;
  status: RecurringStatus;
  isFixed: boolean;
  categoryId: number;
  category: CategoryDTO;
  startDate: string;
  nextRunDate: string;
  endDate: string | null;
  monthlyEquivalent: number;
}

export interface GoalDTO {
  id: string;
  name: string;
  icon: string | null;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  status: GoalStatus;
  percentage: number;
  remaining: number;
  daysRemaining: number | null;
  monthlyContribution: number | null;
  overdue: boolean;
  createdAt: string;
}

export interface NotificationDTO {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "alert" | "success";
  kind: NotificationKind;
  template: string | null;
  params: Record<string, unknown> | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ProfileDTO {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  academicYear: string | null;
  monthlyAllowance: number;
  monthlySavingsGoal: number;
  salaryPayDay: number;
  notifications: { budget: boolean; recurring: boolean; goal: boolean; unusual: boolean };
  createdAt: string;
}

export type ReportPeriod = "month" | "quarter" | "year";

export interface ReportDTO {
  period: ReportPeriod;
  /** Tháng đại diện của kỳ ("YYYY-MM"); client dựng nhãn kỳ theo ngôn ngữ. */
  anchor: string;
  /** true khi báo cáo theo khoảng ngày tùy chọn (from/to) thay vì tháng/quý/năm. */
  custom: boolean;
  /** Danh mục đang lọc (null = tất cả). */
  categoryId: number | null;
  /** ISO – ngày đầu và ngày cuối của kỳ. */
  from: string;
  to: string;
  totals: { income: number; expense: number; net: number; transactionCount: number; averageDailySpend: number };
  trend: CashFlowPoint[];
  weekly: { start: string; end: string; income: number; expense: number }[];
  categories: CategoryBreakdownItem[];
  largestTransactions: TransactionDTO[];
  budgetPerformance: { categoryName: string; limit: number; spent: number; percentage: number }[];
}

/** Mẹo tiết kiệm hiển thị trên dashboard: tính từ dữ liệu của user, mẹo hệ thống (admin) hoặc mẹo riêng đã lưu. */
export type SavingTipDTO =
  | {
      key: string;
      source: "personal";
      template: TipTemplate;
      params: Record<string, unknown>;
      potentialSaving: number;
      pinned: boolean;
    }
  | {
      key: string;
      source: "system" | "own";
      title: string;
      content: string;
      potentialSaving: number | null;
      pinned: boolean;
    };

export interface SystemTipDTO {
  id: number;
  title: string;
  content: string;
  potentialSaving: number | null;
  createdAt: string;
}

/** Ảnh chụp nhận định của một tháng; dữ liệu phiên bản cũ (văn bản thuần) nằm ở legacy*. */
export interface InsightHistoryDTO {
  id: number;
  month: string;
  pinned: boolean;
  generatedAt: string;
  insights: FinancialInsight[] | null;
  tips: { template: TipTemplate; params: Record<string, unknown>; potentialSaving: number }[] | null;
  legacySummary: string | null;
  legacyTip: string | null;
}

/** Một lần tạo/sửa/xóa giao dịch (nhật ký kiểm toán); snapshot là trạng thái ngay sau thao tác. */
export interface TransactionHistoryEntry {
  id: number;
  action: "create" | "update" | "delete";
  at: string;
  snapshot: { amount: number; type: TransactionType; description: string; categoryId: number; date: string };
}
