/**
 * Nội dung sinh ra ở server (thông báo, nhận định) được trả về dạng template + params
 * để client hiển thị theo ngôn ngữ của người xem.
 */

export interface NotificationParams {
  budgetWarning: { category: string; percent: number; spent: number; limit: number };
  budgetExceeded: { category: string; month: string; spent: number; over: number };
  recurringIncome: { name: string; amount: number; date: string; next: string };
  recurringExpense: { name: string; amount: number; date: string; next: string };
  goalMilestone: { goal: string; percent: number; current: number; target: number };
  unusualExpense: { description: string; amount: number; date: string; category: string; typical: number };
  pointsEarned: { points: number; reason: PointReason };
  passwordChanged: { at: string };
  passwordReset: { at: string };
  sessionsRevoked: { at: string };
}

export type NotificationTemplate = keyof NotificationParams;

export type NotificationDictionary = {
  [K in NotificationTemplate]: { title: (p: NotificationParams[K]) => string; message: (p: NotificationParams[K]) => string };
};

export interface InsightParams {
  weeklyChange: { category: string; percent: number; amount: number; direction: "up" | "down" };
  monthlyChange: { category: string; amount: number; direction: "less" | "more" };
  topWeekday: { weekday: number; amount: number };
  budgetStreak: { category: string; months: number };
  topCategory: { category: string; percent: number; amount: number };
  dailyAverage: { amount: number };
  savingsRate: { percent: number };
  overspending: { amount: number; percent: number };
}

export type InsightTemplate = keyof InsightParams;

/** Mẹo tiết kiệm cá nhân hóa (lib/finance/tips.ts). */
export interface TipParams {
  aboveAverage: { category: string; projected: number; average: number };
  budgetRisk: { category: string; limit: number; weekly: number };
  smallPurchases: { count: number; total: number };
  subscriptions: { count: number; monthly: number };
  savingsGap: { goal: number; daily: number };
}

export type TipTemplate = keyof TipParams;

export type TipDictionary = {
  [K in TipTemplate]: { title: (p: TipParams[K]) => string; description: (p: TipParams[K]) => string };
};

export type InsightDictionary = {
  [K in InsightTemplate]: {
    title: (p: InsightParams[K]) => string;
    description: (p: InsightParams[K]) => string;
    value: (p: InsightParams[K]) => string;
  };
};

/** Lý do cộng điểm Campus Points. */
export type PointReason = "dailyLog" | "budgetWeek" | "monthlySavings" | "goalCompleted" | "firstTransaction" | "goalDeposit";
