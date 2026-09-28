"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";

/** Ghi nhanh trên mobile (dưới khối "có thể chi"): hai nút lớn mở sẵn form chi / thu. Desktop dùng nút ở header. */
export function QuickAddCard() {
  const { openCreate } = useTransactionUI();
  const { t } = useI18n();
  const q = t.dashboard.quickAdd;
  return (
    <Card className="p-4">
      <p className="mb-3 text-[13px] font-medium text-muted">{q.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => openCreate({ type: "expense" })}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary text-[15px] font-medium text-foreground transition-colors active:bg-surface-hover"
        >
          <ArrowDownRight className="size-4 text-danger" aria-hidden />
          {q.expense}
        </button>
        <button
          type="button"
          onClick={() => openCreate({ type: "income" })}
          className="flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface-secondary text-[15px] font-medium text-foreground transition-colors active:bg-surface-hover"
        >
          <ArrowUpRight className="size-4 text-success" aria-hidden />
          {q.income}
        </button>
      </div>
    </Card>
  );
}
