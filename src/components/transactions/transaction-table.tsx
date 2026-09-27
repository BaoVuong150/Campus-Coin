"use client";

import { AlertTriangle, ArrowDown, ArrowUp, ChevronRight, Repeat } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { TransactionDTO } from "@/types/finance";
import type { TransactionFilters } from "@/hooks/use-transactions";

type Sort = NonNullable<TransactionFilters["sort"]>;

interface Props {
  items: TransactionDTO[];
  unusual: Set<string>;
  sort: Sort;
  onSort: (sort: Sort) => void;
  onOpen: (tx: TransactionDTO) => void;
}

function SortHeader({ label, field, sort, onSort, className }: { label: string; field: "date" | "amount"; sort: Sort; onSort: (s: Sort) => void; className?: string }) {
  const active = sort.startsWith(field);
  const desc = sort.endsWith("desc");
  const next: Sort = active && desc ? `${field}_asc` : `${field}_desc`;
  return (
    <th scope="col" aria-sort={active ? (desc ? "descending" : "ascending") : "none"} className={cn("px-4 py-2.5 font-medium", className)}>
      <button type="button" onClick={() => onSort(next)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
        {label}
        {active && (desc ? <ArrowDown className="size-3.5" aria-hidden /> : <ArrowUp className="size-3.5" aria-hidden />)}
      </button>
    </th>
  );
}

/** Bảng giao dịch cho desktop (mobile dùng TransactionListItem). */
export function TransactionTable({ items, unusual, sort, onSort, onOpen }: Props) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border text-left text-[12px] text-muted">
        <tr>
          <th scope="col" className="px-4 py-2.5 font-medium">
            Giao dịch
          </th>
          <th scope="col" className="px-4 py-2.5 font-medium">
            Danh mục
          </th>
          <SortHeader label="Ngày" field="date" sort={sort} onSort={onSort} />
          <th scope="col" className="px-4 py-2.5 font-medium">
            Loại
          </th>
          <SortHeader label="Số tiền" field="amount" sort={sort} onSort={onSort} className="text-right [&>button]:ml-auto [&>button]:flex" />
          <th scope="col" className="w-10 px-2 py-2.5">
            <span className="sr-only">Thao tác</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.map((tx) => (
          <tr
            key={tx.id}
            onClick={() => onOpen(tx)}
            className="group cursor-pointer transition-colors hover:bg-surface-hover"
          >
            <td className="max-w-0 px-4 py-3">
              <div className="flex items-center gap-3">
                <CategoryIcon icon={tx.category.icon} color={tx.category.color} size="sm" />
                <span className="truncate font-medium text-foreground">{tx.description}</span>
                {tx.isRecurring && <Repeat className="size-3.5 shrink-0 text-subtle" aria-label="Định kỳ" />}
                {unusual.has(tx.id) && (
                  <span title="Khoản chi này cao hơn mức thường thấy">
                    <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-label="Cao hơn thường lệ" />
                  </span>
                )}
              </div>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-muted">{tx.category.name}</td>
            <td className="tabular px-4 py-3 whitespace-nowrap text-muted">{formatDate(tx.date)}</td>
            <td className="px-4 py-3">
              <Badge tone={tx.type === "income" ? "success" : "neutral"}>{tx.type === "income" ? "Thu" : "Chi"}</Badge>
            </td>
            <td className="px-4 py-3 text-right">
              <Amount value={tx.amount} type={tx.type} />
            </td>
            <td className="px-2 py-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(tx);
                }}
                aria-label={`Xem chi tiết ${tx.description}`}
                className="rounded-md p-1 text-subtle opacity-60 transition hover:bg-surface-secondary hover:text-foreground group-hover:opacity-100"
              >
                <ChevronRight className="size-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
