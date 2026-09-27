import { formatPercent, formatVND } from "@/lib/utils/money";
import { weekdayName } from "@/lib/utils/date";

export type InsightTone = "positive" | "negative" | "neutral";
export type InsightIcon = "trend-up" | "trend-down" | "calendar" | "shield" | "wallet" | "pie" | "piggy";

export interface FinancialInsight {
  id: string;
  tone: InsightTone;
  icon: InsightIcon;
  title: string;
  description: string;
  value: string;
}

export interface CategoryAmounts {
  [categoryId: number]: number;
}

export interface InsightInput {
  categoryNames: Record<number, string>;
  /** Chi tiêu 7 ngày gần nhất theo danh mục. */
  last7DaysByCategory: CategoryAmounts;
  /** Chi tiêu trung bình mỗi 7 ngày theo danh mục trong 8 tuần trước đó. */
  avgWeeklyByCategory: CategoryAmounts;
  /** Số tuần (trong 8 tuần trước) có phát sinh chi tiêu của danh mục – để bỏ qua khoản chi theo tháng như tiền trọ. */
  activeWeeksByCategory: CategoryAmounts;
  /** Tháng này tính đến hôm nay, và cùng số ngày đó của tháng trước. */
  monthToDateByCategory: CategoryAmounts;
  lastMonthToDateByCategory: CategoryAmounts;
  /** Tổng chi theo thứ (0 = CN) và số lần xuất hiện của mỗi thứ trong cửa sổ quan sát. */
  weekdayTotals: number[];
  weekdayOccurrences: number[];
  weekdayTransactionCount: number;
  /** Số tháng liên tiếp (tính lùi từ tháng trước) giữ chi tiêu trong ngân sách, theo danh mục. */
  budgetStreaks: { categoryId: number; months: number }[];
  monthToDateExpense: number;
  monthToDateIncome: number;
  elapsedDays: number;
}

const WEEKLY_MIN_BASELINE = 50_000;
const WEEKLY_CHANGE_THRESHOLD = 0.15;
/** Danh mục phải có chi tiêu ở ít nhất 4/8 tuần mới so sánh theo tuần (chi tiêu đều đặn). */
const WEEKLY_MIN_ACTIVE_WEEKS = 4;
const MONTHLY_MIN_DIFF = 100_000;
const WEEKDAY_MIN_TRANSACTIONS = 15;
const WEEKDAY_LIFT = 1.2;
const MIN_BUDGET_STREAK = 2;

const name = (input: InsightInput, id: number) => input.categoryNames[id] ?? "Khác";

/** Insight thống kê dựa hoàn toàn trên dữ liệu thật; thiếu dữ liệu thì bỏ qua, không bịa. */
export function generateInsights(input: InsightInput): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  let weekly: { id: number; change: number; current: number; avg: number } | null = null;
  for (const [key, avg] of Object.entries(input.avgWeeklyByCategory)) {
    const id = Number(key);
    if (avg < WEEKLY_MIN_BASELINE || (input.activeWeeksByCategory[id] ?? 0) < WEEKLY_MIN_ACTIVE_WEEKS) continue;
    const current = input.last7DaysByCategory[id] ?? 0;
    const change = (current - avg) / avg;
    if (Math.abs(change) >= WEEKLY_CHANGE_THRESHOLD && (!weekly || Math.abs(change) > Math.abs(weekly.change))) {
      weekly = { id, change, current, avg };
    }
  }
  if (weekly) {
    const higher = weekly.change > 0;
    insights.push({
      id: `weekly-${weekly.id}`,
      tone: higher ? "negative" : "positive",
      icon: higher ? "trend-up" : "trend-down",
      title: `${name(input, weekly.id)} tuần này`,
      description: `Chi tiêu ${name(input, weekly.id)} 7 ngày qua ${higher ? "cao" : "thấp"} hơn trung bình ${formatPercent(Math.abs(weekly.change) * 100, 0)}.`,
      value: formatVND(weekly.current),
    });
  }

  let monthly: { id: number; diff: number } | null = null;
  const ids = new Set([
    ...Object.keys(input.monthToDateByCategory),
    ...Object.keys(input.lastMonthToDateByCategory),
  ]);
  for (const key of ids) {
    const id = Number(key);
    const diff = (input.monthToDateByCategory[id] ?? 0) - (input.lastMonthToDateByCategory[id] ?? 0);
    if (Math.abs(diff) >= MONTHLY_MIN_DIFF && (!monthly || Math.abs(diff) > Math.abs(monthly.diff))) {
      monthly = { id, diff };
    }
  }
  if (monthly && monthly.id !== weekly?.id) {
    const less = monthly.diff < 0;
    insights.push({
      id: `monthly-${monthly.id}`,
      tone: less ? "positive" : "negative",
      icon: less ? "trend-down" : "trend-up",
      title: `So với tháng trước`,
      description: `Bạn chi cho ${name(input, monthly.id)} ${less ? "ít" : "nhiều"} hơn tháng trước ${formatVND(Math.abs(monthly.diff))} (cùng kỳ).`,
      value: `${less ? "−" : "+"}${formatVND(Math.abs(monthly.diff))}`,
    });
  }

  if (input.weekdayTransactionCount >= WEEKDAY_MIN_TRANSACTIONS) {
    const averages = input.weekdayTotals.map((total, i) =>
      input.weekdayOccurrences[i] > 0 ? total / input.weekdayOccurrences[i] : 0
    );
    const overall = averages.reduce((a, b) => a + b, 0) / 7;
    const top = averages.indexOf(Math.max(...averages));
    if (overall > 0 && averages[top] >= overall * WEEKDAY_LIFT) {
      insights.push({
        id: "weekday",
        tone: "neutral",
        icon: "calendar",
        title: "Ngày chi tiêu nhiều nhất",
        description: `${weekdayName(top)} là ngày bạn thường chi tiêu nhiều nhất trong 90 ngày qua.`,
        value: `${formatVND(averages[top])}/ngày`,
      });
    }
  }

  const streak = [...input.budgetStreaks].sort((a, b) => b.months - a.months)[0];
  if (streak && streak.months >= MIN_BUDGET_STREAK) {
    insights.push({
      id: `streak-${streak.categoryId}`,
      tone: "positive",
      icon: "shield",
      title: "Giữ ngân sách tốt",
      description: `Bạn đã giữ ngân sách ${name(input, streak.categoryId)} trong ${streak.months} tháng liên tiếp.`,
      value: `${streak.months} tháng`,
    });
  }

  const entries = Object.entries(input.monthToDateByCategory).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0 && input.monthToDateExpense > 0) {
    const [topId, topAmount] = entries[0];
    const share = (topAmount / input.monthToDateExpense) * 100;
    insights.push({
      id: "top-category",
      tone: "neutral",
      icon: "pie",
      title: "Danh mục chi nhiều nhất",
      description: `${name(input, Number(topId))} chiếm ${formatPercent(share, 0)} tổng chi tiêu tháng này.`,
      value: formatVND(topAmount),
    });
  }

  if (input.elapsedDays > 0 && input.monthToDateExpense > 0) {
    insights.push({
      id: "daily-average",
      tone: "neutral",
      icon: "wallet",
      title: "Trung bình mỗi ngày",
      description: `Chi tiêu trung bình mỗi ngày trong tháng này là ${formatVND(input.monthToDateExpense / input.elapsedDays)}.`,
      value: formatVND(input.monthToDateExpense / input.elapsedDays),
    });
  }

  if (input.monthToDateIncome > 0) {
    const rate = ((input.monthToDateIncome - input.monthToDateExpense) / input.monthToDateIncome) * 100;
    insights.push({
      id: "savings-rate",
      tone: rate >= 0 ? "positive" : "negative",
      icon: "piggy",
      title: "Tỷ lệ tiết kiệm",
      description:
        rate >= 0
          ? `Bạn đang giữ lại ${formatPercent(rate, 0)} thu nhập của tháng này.`
          : `Chi tiêu tháng này đang vượt thu nhập ${formatVND(input.monthToDateExpense - input.monthToDateIncome)}.`,
      value: formatPercent(rate, 0),
    });
  }

  return insights;
}
