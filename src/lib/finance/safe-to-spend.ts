import { roundMoney } from "./stats";

export interface SafeToSpendInput {
  currentBalance: number;
  /** Chi phí cố định/định kỳ chưa đến hạn trong tháng này. */
  remainingFixedExpenses: number;
  /** Thu nhập định kỳ dự kiến nhận trước cuối tháng. */
  expectedIncome: number;
  /** Tiền đang để dành trong các mục tiêu tiết kiệm (không nên tiêu). */
  goalReserved: number;
  /** Số tiền muốn giữ lại cuối tháng (mục tiêu tiết kiệm tháng). */
  savingsTarget: number;
  /** Tổng ngân sách còn lại của các danh mục có đặt ngân sách; null nếu chưa đặt ngân sách. */
  budgetRemaining: number | null;
  /** Số ngày còn lại tính cả hôm nay. */
  remainingDays: number;
}

export interface SafeToSpendResult {
  spendable: number;
  daily: number;
  dailyByBalance: number;
  dailyByBudget: number | null;
  limitedBy: "balance" | "budget";
  status: "healthy" | "tight" | "negative";
}

/** Dưới mức này/ngày coi là "eo hẹp" (đủ cho khoảng một bữa ăn sinh viên). */
export const TIGHT_DAILY_THRESHOLD = 50_000;

/**
 * Số tiền có thể chi mỗi ngày mà vẫn trả đủ chi phí cố định và giữ được tiền tiết kiệm:
 *   spendable = số dư + thu nhập định kỳ sắp nhận − chi phí cố định còn lại − tiền mục tiêu − tiết kiệm tháng
 *   mỗi ngày  = min(spendable, ngân sách còn lại) / số ngày còn lại
 */
export function calculateSafeToSpend(input: SafeToSpendInput): SafeToSpendResult {
  const days = Math.max(1, input.remainingDays);
  const spendable = roundMoney(
    input.currentBalance +
      input.expectedIncome -
      input.remainingFixedExpenses -
      input.goalReserved -
      input.savingsTarget
  );

  const dailyByBalance = Math.max(0, roundMoney(spendable / days));
  const dailyByBudget =
    input.budgetRemaining === null ? null : Math.max(0, roundMoney(input.budgetRemaining / days));

  const limitedBy = dailyByBudget !== null && dailyByBudget < dailyByBalance ? "budget" : "balance";
  const daily = limitedBy === "budget" ? (dailyByBudget as number) : dailyByBalance;

  const status: SafeToSpendResult["status"] =
    spendable <= 0 ? "negative" : daily < TIGHT_DAILY_THRESHOLD ? "tight" : "healthy";

  return { spendable, daily, dailyByBalance, dailyByBudget, limitedBy, status };
}
