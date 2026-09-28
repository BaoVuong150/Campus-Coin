import { roundMoney } from "./stats";

/** Số ngày tối thiểu của tháng hiện tại để tin vào tốc độ chi tiêu thực tế thay vì trung bình lịch sử. */
export const MIN_DAYS_FOR_CURRENT_PACE = 7;

export interface ForecastInput {
  currentBalance: number;
  /** Chi tiêu linh hoạt (không tính khoản cố định/định kỳ) từ đầu tháng đến hết hôm nay. */
  variableSpentThisMonth: number;
  /** Số ngày đã qua trong tháng, tính cả hôm nay. */
  elapsedDays: number;
  /** Số ngày còn lại sau hôm nay. */
  daysAfterToday: number;
  /** Chi phí cố định/định kỳ còn phải trả từ ngày mai đến cuối tháng. */
  remainingFixedExpenses: number;
  /** Thu nhập định kỳ dự kiến nhận từ ngày mai đến cuối tháng. */
  expectedIncome: number;
  /** Chi tiêu linh hoạt trung bình/ngày của các tháng trước (null nếu chưa có lịch sử). */
  historicalDailyVariable: number | null;
}

export interface ForecastResult {
  dailyPace: number;
  paceSource: "current_month" | "history" | "none";
  projectedVariableSpend: number;
  projectedEndBalance: number;
  shortfall: number;
}

/**
 * Dự báo số dư cuối tháng bằng ngoại suy tuyến tính:
 * cuối tháng = số dư hiện tại + thu nhập định kỳ sắp nhận − chi phí cố định còn lại − (tốc độ chi/ngày × số ngày còn lại).
 */
export function forecastMonthEnd(input: ForecastInput): ForecastResult {
  let dailyPace = 0;
  let paceSource: ForecastResult["paceSource"] = "none";

  if (input.elapsedDays >= MIN_DAYS_FOR_CURRENT_PACE || input.historicalDailyVariable === null) {
    if (input.elapsedDays > 0) {
      dailyPace = input.variableSpentThisMonth / input.elapsedDays;
      paceSource = "current_month";
    }
  } else {
    dailyPace = input.historicalDailyVariable;
    paceSource = "history";
  }

  const projectedVariableSpend = roundMoney(dailyPace * Math.max(0, input.daysAfterToday));
  const projectedEndBalance = roundMoney(
    input.currentBalance + input.expectedIncome - input.remainingFixedExpenses - projectedVariableSpend
  );

  return {
    dailyPace: roundMoney(dailyPace),
    paceSource,
    projectedVariableSpend,
    projectedEndBalance,
    shortfall: projectedEndBalance < 0 ? -projectedEndBalance : 0,
  };
}
