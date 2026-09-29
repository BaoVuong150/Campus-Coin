"use client";

import { useState } from "react";
import { Eye, History, Pencil } from "lucide-react";
import { useSessionUser } from "@/components/layout/session-context";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { useToast } from "@/context/ToastContext";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { useI18n } from "@/i18n/provider";
import { formatVND } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { TransactionDTO } from "@/types/finance";

/** Hàng "Xem gần đây": mở lại nhanh giao dịch vừa xem/sửa (tải dữ liệu mới nhất từ server). */
export function RecentTransactionsStrip() {
  const user = useSessionUser();
  const { items, forget } = useRecentTransactions(user.id);
  const { openDetail } = useTransactionUI();
  const { toast } = useToast();
  const { t } = useI18n();
  const l = t.transactions.recent;
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const open = async (id: string) => {
    if (loadingId) return;
    setLoadingId(id);
    try {
      openDetail(await apiFetch<TransactionDTO>(`/api/transactions/${id}`));
    } catch (err) {
      // Giao dịch đã bị xóa: bỏ khỏi danh sách thay vì hiện dữ liệu cũ.
      if (err instanceof ApiClientError && err.status === 404) {
        forget(id);
        toast.info(l.gone);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section aria-label={l.title} className="mb-3">
      <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-muted">
        <History className="size-3.5" aria-hidden /> {l.title}
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((item) => {
          const Icon = item.action === "edited" ? Pencil : Eye;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => open(item.id)}
                disabled={loadingId === item.id}
                title={item.action === "edited" ? l.edited : l.viewed}
                className="flex h-10 max-w-60 items-center gap-2 rounded-full border border-border bg-surface pr-3 pl-2.5 text-[13px] transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                <Icon className="size-3.5 shrink-0 text-subtle" aria-hidden />
                <span className="sr-only">{item.action === "edited" ? l.edited : l.viewed}: </span>
                <span className="min-w-0 truncate text-foreground">{item.description}</span>
                <span className={cn("tabular shrink-0", item.type === "income" ? "text-success" : "text-muted")}>
                  {item.type === "income" ? "+" : "−"}
                  {formatVND(item.amount)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
