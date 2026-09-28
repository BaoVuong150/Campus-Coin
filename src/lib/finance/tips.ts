import type { TipParams, TipTemplate } from "@/i18n/templates";

/**
 * Động cơ gợi ý tiết kiệm cá nhân hóa (SRS 3.8): so sánh chi tiêu hiện tại với trung bình lịch sử, ngân sách và mục tiêu
 * tiết kiệm; mỗi mẹo kèm số tiền có thể tiết kiệm ước tính mỗi tháng để xếp hạng. Chỉ dùng dữ liệu thật của user,
 * thiếu dữ liệu thì không sinh mẹo (không bịa).
 */

export type SavingTipSuggestion = {
  [K in TipTemplate]: {
    /** Khóa ổn định trong tháng – dùng để ghim/bỏ qua; sang tháng mới mẹo xuất hiện lại. */
    key: string;
    template: K;
    params: TipParams[K];
    /** Số tiền có thể tiết kiệm ước tính mỗi tháng (đã làm tròn 1.000 ₫). */
    potentialSaving: number;
  };
}[TipTemplate];

export interface TipInput {
  month: string;
  elapsedDays: number;
  daysInMonth: number;
  remainingDays: number;
  categoryNames: Record<number, string>;
  /** Chi tiêu từ đầu tháng tới hôm nay theo danh mục. */
  monthToDate: Record<number, number>;
  /** Chi tiêu trung bình mỗi tháng theo danh mục (các tháng trước có dữ liệu). */
  monthlyAverage: Record<number, number>;
  budgets: { categoryId: number; limit: number; spent: number }[];
  /** Các khoản chi nhỏ (< 50.000 ₫) trong tháng. */
  smallPurchases: { count: number; total: number };
  /** Khoản định kỳ thuộc danh mục dịch vụ số đang chạy. */
  subscriptions: { count: number; monthly: number };
  savingsGoal: number;
  /** Tiết kiệm dự kiến cuối tháng = thu (đã nhận + sắp nhận) − chi (đã chi + dự kiến). */
  projectedSavings: number;
}

export const TIP_RULES = {
  minDaysForPace: 7,
  aboveAverageMinBase: 200_000,
  aboveAverageLift: 1.2,
  minPotential: 50_000,
  smallPurchaseMinCount: 8,
  smallPurchaseCutShare: 0.3,
  subscriptionsMinMonthly: 100_000,
  subscriptionsCutShare: 0.3,
};

const roundK = (value: number) => Math.round(value / 1000) * 1000;

export function generateSavingTips(input: TipInput): SavingTipSuggestion[] {
  const tips: SavingTipSuggestion[] = [];
  const pace = input.elapsedDays > 0 ? input.daysInMonth / input.elapsedDays : 0;
  const name = (id: number) => input.categoryNames[id] ?? "";

  // 1) Danh mục đang chi vượt mức trung bình các tháng trước.
  if (input.elapsedDays >= TIP_RULES.minDaysForPace) {
    for (const [key, spent] of Object.entries(input.monthToDate)) {
      const id = Number(key);
      const average = input.monthlyAverage[id] ?? 0;
      if (average < TIP_RULES.aboveAverageMinBase) continue;
      const projected = spent * pace;
      const potential = roundK(projected - average);
      if (projected >= average * TIP_RULES.aboveAverageLift && potential >= TIP_RULES.minPotential) {
        tips.push({
          key: `above-average:${id}:${input.month}`,
          template: "aboveAverage",
          params: { category: name(id), projected: roundK(projected), average: roundK(average) },
          potentialSaving: potential,
        });
      }
    }
  }

  // 2) Ngân sách sẽ vượt nếu giữ tốc độ chi hiện tại → gợi ý hạn mức mỗi tuần.
  if (input.elapsedDays >= 3) {
    const weeksLeft = Math.max(1, Math.ceil(input.remainingDays / 7));
    for (const b of input.budgets) {
      if (b.limit <= 0) continue;
      const projected = b.spent * pace;
      const potential = roundK(projected - b.limit);
      if (potential >= TIP_RULES.minPotential) {
        tips.push({
          key: `budget-risk:${b.categoryId}:${input.month}`,
          template: "budgetRisk",
          params: { category: name(b.categoryId), limit: b.limit, weekly: roundK(Math.max(0, b.limit - b.spent) / weeksLeft) },
          potentialSaving: potential,
        });
      }
    }
  }

  // 3) Nhiều khoản chi nhỏ lặp lại (cà phê, đồ ăn vặt…).
  if (input.smallPurchases.count >= TIP_RULES.smallPurchaseMinCount && input.elapsedDays > 0) {
    const potential = roundK(input.smallPurchases.total * pace * TIP_RULES.smallPurchaseCutShare);
    if (potential >= TIP_RULES.minPotential) {
      tips.push({
        key: `small-purchases:${input.month}`,
        template: "smallPurchases",
        params: { count: input.smallPurchases.count, total: roundK(input.smallPurchases.total) },
        potentialSaving: potential,
      });
    }
  }

  // 4) Nhiều dịch vụ số trả định kỳ.
  if (input.subscriptions.count >= 2 && input.subscriptions.monthly >= TIP_RULES.subscriptionsMinMonthly) {
    tips.push({
      key: `subscriptions:${input.month}`,
      template: "subscriptions",
      params: { count: input.subscriptions.count, monthly: roundK(input.subscriptions.monthly) },
      potentialSaving: roundK(input.subscriptions.monthly * TIP_RULES.subscriptionsCutShare),
    });
  }

  // 5) Chưa đạt mục tiêu tiết kiệm tháng.
  if (input.savingsGoal > 0 && input.projectedSavings < input.savingsGoal) {
    const gap = input.savingsGoal - Math.max(0, input.projectedSavings);
    if (gap >= TIP_RULES.minPotential) {
      tips.push({
        key: `savings-gap:${input.month}`,
        template: "savingsGap",
        params: { goal: input.savingsGoal, daily: roundK(gap / Math.max(1, input.remainingDays)) },
        potentialSaving: roundK(gap),
      });
    }
  }

  return tips.sort((a, b) => b.potentialSaving - a.potentialSaving);
}
