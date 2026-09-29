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

export type ForecastConfidence = "insufficient" | "low" | "medium" | "high";

/** Ngưỡng số ngày có dữ liệu cho từng mức tin cậy của dự báo. */
export const FORECAST_CONFIDENCE_DAYS = { minimum: 3, medium: 14, high: 45 };

/**
 * Mức tin cậy của dự báo theo số ngày thực sự có dữ liệu. Dưới 3 ngày không hiển thị con số dự báo
 * (tránh độ chính xác giả); càng nhiều ngày càng đáng tin.
 */
export function forecastConfidence(dataDays: number, paceSource: ForecastResult["paceSource"]): ForecastConfidence {
  if (paceSource === "none" || dataDays < FORECAST_CONFIDENCE_DAYS.minimum) return "insufficient";
  if (dataDays < FORECAST_CONFIDENCE_DAYS.medium) return "low";
  if (dataDays < FORECAST_CONFIDENCE_DAYS.high) return "medium";
  return "high";
}

export interface NextMonthInput {
  /** Thu nhập cố định dự kiến trong tháng tới (khoản thu định kỳ, hoặc trợ cấp cơ bản nếu chưa khai báo định kỳ). */
  fixedIncome: number;
  /** Chi phí cố định/định kỳ đến hạn trong tháng tới. */
  fixedExpenses: number;
  /** Chi tiêu linh hoạt trung bình/ngày gần đây (null nếu chưa đủ dữ liệu). */
  dailyVariable: number | null;
  daysInMonth: number;
}

export interface NextMonthForecast {
  expectedIncome: number;
  fixedExpenses: number;
  variableExpenses: number;
  /** Thu dự kiến − chi dự kiến; âm nghĩa là tháng tới có thể thiếu tiền. */
  projectedNet: number;
}

/**
 * Dự báo tháng tới theo xu hướng lịch sử (SRS – "forecasts for the upcoming month"):
 * khoản cố định lấy đúng theo lịch định kỳ, chi linh hoạt = tốc độ chi/ngày gần đây × số ngày của tháng.
 * Thu nhập không đều (làm thêm, học bổng, quà) không được cộng để dự báo không lạc quan quá mức.
 */
export function forecastNextMonth(input: NextMonthInput): NextMonthForecast | null {
  if (input.dailyVariable === null) return null;
  const variableExpenses = roundMoney(input.dailyVariable * input.daysInMonth);
  const expectedIncome = roundMoney(input.fixedIncome);
  const fixedExpenses = roundMoney(input.fixedExpenses);
  return { expectedIncome, fixedExpenses, variableExpenses, projectedNet: roundMoney(expectedIncome - fixedExpenses - variableExpenses) };
}
