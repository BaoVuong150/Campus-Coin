import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { Progress } from "@/components/ui/progress";
import { formatVND } from "@/lib/utils/money";
import type { BudgetItemDTO } from "@/types/finance";

export function budgetTone(status: BudgetItemDTO["status"]) {
  return status === "exceeded" ? "danger" : status === "warning" ? "warning" : "primary";
}

export function budgetMessage(item: BudgetItemDTO): string | null {
  if (item.status === "exceeded") return `Đã vượt ngân sách ${item.category.name} ${formatVND(item.overBy)}.`;
  if (item.status === "warning") return `Bạn đã sử dụng ${item.percentage}% ngân sách ${item.category.name}.`;
  return null;
}

export function BudgetRow({ item, actions }: { item: BudgetItemDTO; actions?: ReactNode }) {
  const message = budgetMessage(item);
  return (
    <div className="space-y-2 py-3.5">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={item.category.icon} color={item.category.color} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-foreground">{item.category.name}</p>
            <p className="tabular text-[13px] whitespace-nowrap text-muted">
              <span className="font-medium text-foreground">{formatVND(item.spent)}</span> / {formatVND(item.limit)}
            </p>
          </div>
        </div>
        {actions}
      </div>
      <div className="flex items-center gap-3">
        <Progress value={item.percentage} tone={budgetTone(item.status)} label={`Ngân sách ${item.category.name}`} className="flex-1" />
        <span className="tabular w-11 text-right text-[12px] font-medium text-muted">{item.percentage}%</span>
      </div>
      {message && (
        <p className={`flex items-center gap-1.5 text-[12px] ${item.status === "exceeded" ? "text-danger" : "text-warning"}`}>
          <AlertTriangle className="size-3.5" aria-hidden /> {message}
        </p>
      )}
    </div>
  );
}
