"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { CategoryIcon } from "@/components/common/category-icon";
import { Progress } from "@/components/ui/progress";
import { formatVND } from "@/lib/utils/money";
import type { BudgetItemDTO } from "@/types/finance";
import type { Messages } from "@/i18n";
import { useI18n } from "@/i18n/provider";

export function budgetTone(status: BudgetItemDTO["status"]) {
  return status === "exceeded" ? "danger" : status === "warning" ? "warning" : "primary";
}

export function budgetMessage(t: Messages, name: string, item: BudgetItemDTO): string | null {
  if (item.status === "exceeded") return t.budgets.exceededMessage(name, formatVND(item.overBy));
  if (item.status === "warning") return t.budgets.warningMessage(name, item.percentage);
  return null;
}

/**
 * Một dòng ngân sách. Khi dòng hẹp (điện thoại) số tiền "đã chi / hạn mức" xuống dòng riêng dưới thanh tiến độ
 * thay vì ép chung một hàng với tên danh mục và nút thao tác (container query theo chiều rộng dòng).
 */
export function BudgetRow({ item, actions }: { item: BudgetItemDTO; actions?: ReactNode }) {
  const { t, fmt } = useI18n();
  const name = fmt.category(item.category.name);
  const message = budgetMessage(t, name, item);
  const amounts = (
    <>
      <span className="font-medium text-foreground">{formatVND(item.spent)}</span> / {formatVND(item.limit)}
    </>
  );
  return (
    <div className="@container space-y-2 py-3.5">
      <div className="flex items-center gap-3">
        <CategoryIcon icon={item.category.icon} color={item.category.color} size="sm" />
        <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">{name}</p>
          <p className="tabular hidden text-[13px] whitespace-nowrap text-muted @md:block">{amounts}</p>
        </div>
        {actions}
      </div>
      <div className="flex items-center gap-3">
        <Progress value={item.percentage} tone={budgetTone(item.status)} label={t.budgets.progressLabel(name)} className="flex-1" />
        <span className="tabular w-11 text-right text-[12px] font-medium text-muted">{item.percentage}%</span>
      </div>
      <p className="tabular text-[13px] text-muted @md:hidden">{amounts}</p>
      {message && (
        <p className={`flex items-start gap-1.5 text-[12px] ${item.status === "exceeded" ? "text-danger" : "text-warning"}`}>
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden /> {message}
        </p>
      )}
    </div>
  );
}
