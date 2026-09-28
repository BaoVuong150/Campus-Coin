"use client";

import { AlertTriangle, Repeat } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { useI18n } from "@/i18n/provider";
import type { TransactionDTO } from "@/types/finance";

interface Props {
  tx: TransactionDTO;
  unusual?: boolean;
  onOpen: (tx: TransactionDTO) => void;
}

/** Dòng giao dịch dạng card – dùng cho mobile và danh sách gọn. */
export function TransactionListItem({ tx, unusual, onOpen }: Props) {
  const { t, fmt } = useI18n();
  return (
    <button
      type="button"
      onClick={() => onOpen(tx)}
      className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-surface-hover"
    >
      <CategoryIcon icon={tx.category.icon} color={tx.category.color} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
          <span className="truncate">{tx.description}</span>
          {tx.isRecurring && <Repeat className="size-3.5 shrink-0 text-subtle" aria-label={t.transactions.table.recurring} />}
          {unusual && <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-label={t.transactions.table.unusual} />}
        </p>
        <p className="truncate text-[12px] text-subtle">
          {fmt.category(tx.category.name)} · {fmt.relativeDay(tx.date)}
        </p>
      </div>
      <Amount value={tx.amount} type={tx.type} className="text-sm" />
    </button>
  );
}
