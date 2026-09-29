"use client";

import { AlertTriangle, History, Pencil, Repeat, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { useApi } from "@/hooks/use-api";
import { useCategories } from "@/hooks/use-categories";
import { useTransactionMutations } from "@/hooks/use-transactions";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import type { TransactionDTO, TransactionHistoryEntry } from "@/types/finance";

interface Props {
  transaction: TransactionDTO | null;
  unusual?: boolean;
  onClose: () => void;
  onEdit: (tx: TransactionDTO) => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function TransactionDetailSheet({ transaction, unusual, onClose, onEdit }: Props) {
  const { remove } = useTransactionMutations();
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const d = t.transactions.detail;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;
    const ok = await confirm({
      title: d.deleteTitle,
      message: d.deleteMessage(transaction.description),
      confirmText: d.deleteConfirm,
      isDestructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await remove(transaction.id);
      toast.success(d.deleted);
      onClose();
    } catch (error) {
      toast.error(d.deleteFailed, fmt.error(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={!!transaction}
      onClose={onClose}
      variant="sheet"
      title={d.title}
      footer={
        transaction && (
          <>
            <Button variant="danger" onClick={handleDelete} loading={deleting} className="sm:mr-auto">
              <Trash2 /> {t.common.delete}
            </Button>
            <Button variant="outline" onClick={() => onEdit(transaction)}>
              <Pencil /> {d.edit}
            </Button>
          </>
        )
      }
    >
      {transaction && (
        <div>
          <div className="flex flex-col items-center gap-3 border-b border-border pb-5 text-center">
            <CategoryIcon icon={transaction.category.icon} color={transaction.category.color} />
            <Amount value={transaction.amount} type={transaction.type} className="text-3xl font-semibold tracking-tight" />
            <p className="text-sm text-muted">{transaction.description}</p>
            {unusual && (
              <Badge tone="warning">
                <AlertTriangle /> {d.unusual}
              </Badge>
            )}
          </div>
          <dl className="divide-y divide-border">
            <Row label={d.type}>
              <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                {transaction.type === "income" ? t.common.income : t.common.expense}
              </Badge>
            </Row>
            <Row label={d.category}>{fmt.category(transaction.category.name)}</Row>
            <Row label={d.date}>{formatDate(transaction.date)}</Row>
            <Row label={d.recurring}>
              {transaction.isRecurring ? (
                <span className="inline-flex items-center gap-1.5">
                  <Repeat className="size-3.5 text-subtle" aria-hidden /> {t.common.yes}
                </span>
              ) : (
                t.common.no
              )}
            </Row>
            <Row label={d.createdAt}>{formatDateTime(transaction.createdAt)}</Row>
            {transaction.updatedAt !== transaction.createdAt && <Row label={d.updatedAt}>{formatDateTime(transaction.updatedAt)}</Row>}
          </dl>
          <TransactionHistory id={transaction.id} />
        </div>
      )}
    </Dialog>
  );
}

/** Nhật ký thay đổi (mới nhất trước): mỗi lần tạo/sửa ghi lại số tiền, mô tả, danh mục, ngày tại thời điểm đó. */
function TransactionHistory({ id }: { id: string }) {
  const { t, fmt } = useI18n();
  const h = t.transactions.detail.history;
  const { data } = useApi<TransactionHistoryEntry[]>(`/api/transactions/${id}/history`);
  const { data: categories } = useCategories();
  if (!data || data.length === 0) return null;
  const categoryName = (categoryId: number) => {
    const found = categories?.find((c) => c.id === categoryId);
    return found ? fmt.category(found.name) : "—";
  };

  return (
    <section className="mt-5 border-t border-border pt-4" aria-labelledby={`history-${id}`}>
      <h3 id={`history-${id}`} className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <History className="size-3.5" aria-hidden /> {h.title}
      </h3>
      <ol className="space-y-3">
        {data.map((entry) => (
          <li key={entry.id} className="rounded-md border border-border px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={entry.action === "delete" ? "danger" : entry.action === "create" ? "success" : "neutral"}>{h.actions[entry.action]}</Badge>
              <span className="text-[12px] text-muted">{formatDateTime(entry.at)}</span>
            </div>
            <p className="mt-1.5 text-foreground">
              {entry.snapshot.description} · <Amount value={entry.snapshot.amount} type={entry.snapshot.type} />
            </p>
            <p className="text-[12px] text-muted">
              {categoryName(entry.snapshot.categoryId)} · {formatDate(entry.snapshot.date)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
