import { BUDGET_EXCEEDED_PERCENT, BUDGET_WARNING_PERCENT } from "@/constants/finance";

export type BudgetHealth = "normal" | "warning" | "exceeded";

export interface BudgetComputation {
  limit: number;
  spent: number;
  remaining: number;
  overBy: number;
  percentage: number;
  status: BudgetHealth;
}

export function computeBudget(limit: number, spent: number): BudgetComputation {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const status: BudgetHealth =
    percentage >= BUDGET_EXCEEDED_PERCENT && spent > limit
      ? "exceeded"
      : percentage >= BUDGET_WARNING_PERCENT
        ? "warning"
        : "normal";
  return {
    limit,
    spent,
    remaining: Math.max(0, limit - spent),
    overBy: Math.max(0, spent - limit),
    percentage: Math.round(percentage),
    status,
  };
}

export interface BudgetTotals {
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export function summarizeBudgets(items: Pick<BudgetComputation, "limit" | "spent" | "remaining">[]): BudgetTotals {
  const limit = items.reduce((a, b) => a + b.limit, 0);
  const spent = items.reduce((a, b) => a + b.spent, 0);
  const remaining = items.reduce((a, b) => a + b.remaining, 0);
  return { limit, spent, remaining, percentage: limit > 0 ? Math.round((spent / limit) * 100) : 0 };
}
