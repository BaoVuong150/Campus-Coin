"use client";

import { CategoryIcon } from "@/components/common/category-icon";
import { Progress } from "@/components/ui/progress";
import { formatVND } from "@/lib/utils/money";
import type { GoalDTO } from "@/types/finance";
import type { Messages } from "@/i18n";
import { useI18n } from "@/i18n/provider";

export function goalMeta(t: Messages, goal: GoalDTO): string {
  if (goal.status === "completed") return t.goals.completedStatus;
  if (goal.daysRemaining === null) return t.goals.noDeadline;
  if (goal.overdue) return t.dates.overdue(Math.abs(goal.daysRemaining));
  return t.dates.daysLeft(goal.daysRemaining);
}

export function GoalProgressRow({ goal }: { goal: GoalDTO }) {
  const { t } = useI18n();
  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={goal.icon} color="var(--primary)" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
          <p className="text-[12px] text-subtle">{goalMeta(t, goal)}</p>
        </div>
        <p className="tabular text-[13px] whitespace-nowrap text-muted">
          <span className="font-medium text-foreground">{formatVND(goal.currentAmount)}</span> / {formatVND(goal.targetAmount)}
        </p>
      </div>
      <Progress value={goal.percentage} label={t.goals.progressLabel(goal.name)} size="sm" />
    </div>
  );
}
