"use client";

import { AlertTriangle, Pencil, Repeat, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { useTransactionMutations } from "@/hooks/use-transactions";
import { errorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import type { TransactionDTO } from "@/types/finance";

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
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;
    const ok = await confirm({
      title: "Xóa giao dịch?",
      message: `"${transaction.description}" sẽ bị xóa khỏi sổ thu chi. Lịch sử thay đổi vẫn được lưu để đối soát.`,
      confirmText: "Xóa giao dịch",
      isDestructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await remove(transaction.id);
      toast.success("Đã xóa giao dịch");
      onClose();
    } catch (error) {
      toast.error("Không thể xóa giao dịch", errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={!!transaction}
      onClose={onClose}
      variant="sheet"
      title="Chi tiết giao dịch"
      footer={
        transaction && (
          <>
            <Button variant="danger" onClick={handleDelete} loading={deleting} className="sm:mr-auto">
              <Trash2 /> Xóa
            </Button>
            <Button variant="outline" onClick={() => onEdit(transaction)}>
              <Pencil /> Chỉnh sửa
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
                <AlertTriangle /> Khoản chi này cao hơn mức thường thấy
              </Badge>
            )}
          </div>
          <dl className="divide-y divide-border">
            <Row label="Loại">
              <Badge tone={transaction.type === "income" ? "success" : "danger"}>
                {transaction.type === "income" ? "Thu nhập" : "Chi tiêu"}
              </Badge>
            </Row>
            <Row label="Danh mục">{transaction.category.name}</Row>
            <Row label="Ngày">{formatDate(transaction.date)}</Row>
            <Row label="Định kỳ">
              {transaction.isRecurring ? (
                <span className="inline-flex items-center gap-1.5">
                  <Repeat className="size-3.5 text-subtle" aria-hidden /> Có
                </span>
              ) : (
                "Không"
              )}
            </Row>
            <Row label="Tạo lúc">{formatDateTime(transaction.createdAt)}</Row>
            {transaction.updatedAt !== transaction.createdAt && <Row label="Cập nhật">{formatDateTime(transaction.updatedAt)}</Row>}
          </dl>
        </div>
      )}
    </Dialog>
  );
}
