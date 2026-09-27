import { daysUntil } from "@/lib/utils/date";

export interface GoalProgress {
  percentage: number;
  remaining: number;
  daysRemaining: number | null;
  monthlyContribution: number | null;
  overdue: boolean;
}

const AVG_DAYS_PER_MONTH = 30.44;

/** Tiến độ mục tiêu và số tiền cần để dành mỗi tháng để kịp hạn. */
export function computeGoalProgress(
  target: number,
  current: number,
  deadline: Date | null,
  now = new Date()
): GoalProgress {
  const remaining = Math.max(0, target - current);
  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  if (!deadline) return { percentage, remaining, daysRemaining: null, monthlyContribution: null, overdue: false };

  const daysRemaining = daysUntil(deadline, now);
  const overdue = daysRemaining < 0 && remaining > 0;
  const months = Math.max(1, Math.ceil(Math.max(0, daysRemaining) / AVG_DAYS_PER_MONTH));
  const monthlyContribution = remaining === 0 ? 0 : Math.ceil(remaining / months);

  return { percentage, remaining, daysRemaining, monthlyContribution, overdue };
}
