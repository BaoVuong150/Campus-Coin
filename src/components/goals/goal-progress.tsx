import { CategoryIcon } from "@/components/common/category-icon";
import { Progress } from "@/components/ui/progress";
import { formatVND } from "@/lib/utils/money";
import type { GoalDTO } from "@/types/finance";

export function goalMeta(goal: GoalDTO): string {
  if (goal.status === "completed") return "Đã hoàn thành";
  if (goal.daysRemaining === null) return "Không đặt hạn";
  if (goal.overdue) return `Quá hạn ${Math.abs(goal.daysRemaining)} ngày`;
  return `Còn ${goal.daysRemaining} ngày`;
}

export function GoalProgressRow({ goal }: { goal: GoalDTO }) {
  return (
    <div className="space-y-2 py-3">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={goal.icon} color="var(--primary)" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{goal.name}</p>
          <p className="text-[12px] text-subtle">{goalMeta(goal)}</p>
        </div>
        <p className="tabular text-[13px] whitespace-nowrap text-muted">
          <span className="font-medium text-foreground">{formatVND(goal.currentAmount)}</span> / {formatVND(goal.targetAmount)}
        </p>
      </div>
      <Progress value={goal.percentage} label={`Tiến độ ${goal.name}`} size="sm" />
    </div>
  );
}
