/**
 * Dữ liệu minh họa cho landing page (không phải dữ liệu người dùng, không gọi database).
 * Các con số khớp với công thức thật của ứng dụng:
 *   theo số dư  = (8.640.000 − 2.150.000 − 1.500.000) ÷ 12 ≈ 415.833 ₫/ngày
 *   theo ngân sách = 1.512.000 ÷ 12 = 126.000 ₫/ngày  → lấy mức thấp hơn.
 */

export type DemoCategory = "food" | "transport" | "entertainment" | "education";
export type DemoIcon = "coffee" | "bike" | "wallet";

export interface DemoBudget {
  category: DemoCategory;
  spent: number;
  limit: number;
}

export interface DemoMonth {
  /** "YYYY-MM" tương đối: 0 = tháng hiện tại, -1 = tháng trước... */
  offset: number;
  income: number;
  expense: number;
}

export interface DemoFinance {
  userName: string;
  balance: number;
  balanceChangePercent: number;
  balanceTrend: number[];
  daysLeft: number;
  daysInMonth: number;
  fixedExpensesLeft: number;
  savingsTarget: number;
  safeToSpend: number;
  budgets: DemoBudget[];
  cashFlow: DemoMonth[];
  transactions: { icon: DemoIcon; amount: number; type: "income" | "expense" }[];
  goal: { current: number; target: number; daysLeft: number; monthlyContribution: number };
}

export const DEMO_FINANCE: DemoFinance = {
  userName: "An",
  balance: 8_640_000,
  balanceChangePercent: 12.4,
  /** Số dư cuối mỗi tuần – dùng cho sparkline. */
  balanceTrend: [6_900_000, 7_150_000, 7_020_000, 7_480_000, 7_760_000, 7_690_000, 8_120_000, 8_640_000],
  daysLeft: 12,
  daysInMonth: 30,
  fixedExpensesLeft: 2_150_000,
  savingsTarget: 1_500_000,
  safeToSpend: 126_000,
  budgets: [
    { category: "food", spent: 1_640_000, limit: 2_000_000 },
    { category: "transport", spent: 360_000, limit: 800_000 },
    { category: "entertainment", spent: 610_000, limit: 1_000_000 },
    { category: "education", spent: 178_000, limit: 500_000 },
  ],
  /** 12 tháng gần nhất, cũ → mới. */
  cashFlow: [
    { offset: -11, income: 5_800_000, expense: 5_120_000 },
    { offset: -10, income: 6_100_000, expense: 5_640_000 },
    { offset: -9, income: 5_900_000, expense: 6_050_000 },
    { offset: -8, income: 6_400_000, expense: 5_380_000 },
    { offset: -7, income: 6_200_000, expense: 5_910_000 },
    { offset: -6, income: 7_000_000, expense: 6_120_000 },
    { offset: -5, income: 6_500_000, expense: 5_470_000 },
    { offset: -4, income: 6_800_000, expense: 6_260_000 },
    { offset: -3, income: 6_600_000, expense: 5_790_000 },
    { offset: -2, income: 7_200_000, expense: 6_480_000 },
    { offset: -1, income: 6_900_000, expense: 5_860_000 },
    { offset: 0, income: 7_500_000, expense: 5_320_000 },
  ],
  transactions: [
    { icon: "coffee", amount: 45_000, type: "expense" },
    { icon: "bike", amount: 32_000, type: "expense" },
    { icon: "wallet", amount: 3_000_000, type: "income" },
  ],
  goal: {
    current: 12_500_000,
    target: 25_000_000,
    daysLeft: 246,
    monthlyContribution: 1_560_000,
  },
};

/** Tổng ngân sách còn lại của dữ liệu mẫu. */
export const DEMO_BUDGET_REMAINING = DEMO_FINANCE.budgets.reduce((sum, b) => sum + (b.limit - b.spent), 0);
