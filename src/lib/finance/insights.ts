import type { InsightParams, InsightTemplate } from "@/i18n/templates";

export type InsightTone = "positive" | "negative" | "neutral";
export type InsightIcon = "trend-up" | "trend-down" | "calendar" | "shield" | "wallet" | "pie" | "piggy";

/** Nhận định dạng dữ liệu (template + params); giao diện tự hiển thị theo ngôn ngữ người xem. */
export type FinancialInsight = {
  [K in InsightTemplate]: { id: string; tone: InsightTone; icon: InsightIcon; template: K; params: InsightParams[K] };
}[InsightTemplate];

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

/** Tên danh mục gốc (chưa dịch); client dịch danh mục mặc định theo ngôn ngữ. */
const name = (input: InsightInput, id: number) => input.categoryNames[id] ?? "";

/** Insight thống kê dựa hoàn toàn trên dữ liệu thật; thiếu dữ liệu thì bỏ qua, không bịa. */
export function generateInsights(input: InsightInput): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  let weekly: { id: number; change: number; current: number } | null = null;
  for (const [key, avg] of Object.entries(input.avgWeeklyByCategory)) {
    const id = Number(key);
    if (avg < WEEKLY_MIN_BASELINE || (input.activeWeeksByCategory[id] ?? 0) < WEEKLY_MIN_ACTIVE_WEEKS) continue;
    const current = input.last7DaysByCategory[id] ?? 0;
    const change = (current - avg) / avg;
    if (Math.abs(change) >= WEEKLY_CHANGE_THRESHOLD && (!weekly || Math.abs(change) > Math.abs(weekly.change))) {
      weekly = { id, change, current };
    }
  }
  if (weekly) {
    const up = weekly.change > 0;
    insights.push({
      id: `weekly-${weekly.id}`,
      tone: up ? "negative" : "positive",
      icon: up ? "trend-up" : "trend-down",
      template: "weeklyChange",
      params: { category: name(input, weekly.id), percent: Math.abs(weekly.change) * 100, amount: weekly.current, direction: up ? "up" : "down" },
    });
  }

  let monthly: { id: number; diff: number } | null = null;
  const ids = new Set([...Object.keys(input.monthToDateByCategory), ...Object.keys(input.lastMonthToDateByCategory)]);
  for (const key of ids) {
    const id = Number(key);
    const diff = (input.monthToDateByCategory[id] ?? 0) - (input.lastMonthToDateByCategory[id] ?? 0);
    if (Math.abs(diff) >= MONTHLY_MIN_DIFF && (!monthly || Math.abs(diff) > Math.abs(monthly.diff))) monthly = { id, diff };
  }
  if (monthly && monthly.id !== weekly?.id) {
    const less = monthly.diff < 0;
    insights.push({
      id: `monthly-${monthly.id}`,
      tone: less ? "positive" : "negative",
      icon: less ? "trend-down" : "trend-up",
      template: "monthlyChange",
      params: { category: name(input, monthly.id), amount: Math.abs(monthly.diff), direction: less ? "less" : "more" },
    });
  }

  if (input.weekdayTransactionCount >= WEEKDAY_MIN_TRANSACTIONS) {
    const averages = input.weekdayTotals.map((total, i) => (input.weekdayOccurrences[i] > 0 ? total / input.weekdayOccurrences[i] : 0));
    const overall = averages.reduce((a, b) => a + b, 0) / 7;
    const top = averages.indexOf(Math.max(...averages));
    if (overall > 0 && averages[top] >= overall * WEEKDAY_LIFT) {
      insights.push({ id: "weekday", tone: "neutral", icon: "calendar", template: "topWeekday", params: { weekday: top, amount: averages[top] } });
    }
  }

  const streak = [...input.budgetStreaks].sort((a, b) => b.months - a.months)[0];
  if (streak && streak.months >= MIN_BUDGET_STREAK) {
    insights.push({
      id: `streak-${streak.categoryId}`,
      tone: "positive",
      icon: "shield",
      template: "budgetStreak",
      params: { category: name(input, streak.categoryId), months: streak.months },
    });
  }

  const entries = Object.entries(input.monthToDateByCategory).sort((a, b) => b[1] - a[1]);
  if (entries.length > 0 && input.monthToDateExpense > 0) {
    const [topId, topAmount] = entries[0];
    insights.push({
      id: "top-category",
      tone: "neutral",
      icon: "pie",
      template: "topCategory",
      params: { category: name(input, Number(topId)), percent: (topAmount / input.monthToDateExpense) * 100, amount: topAmount },
    });
  }

  if (input.elapsedDays > 0 && input.monthToDateExpense > 0) {
    insights.push({
      id: "daily-average",
      tone: "neutral",
      icon: "wallet",
      template: "dailyAverage",
      params: { amount: input.monthToDateExpense / input.elapsedDays },
    });
  }

  if (input.monthToDateIncome > 0) {
    const rate = ((input.monthToDateIncome - input.monthToDateExpense) / input.monthToDateIncome) * 100;
    insights.push(
      rate >= 0
        ? { id: "savings-rate", tone: "positive", icon: "piggy", template: "savingsRate", params: { percent: rate } }
        : {
            id: "savings-rate",
            tone: "negative",
            icon: "piggy",
            template: "overspending",
            params: { percent: rate, amount: input.monthToDateExpense - input.monthToDateIncome },
          }
    );
  }

  return insights;
}
