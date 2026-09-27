"use client";

import { useState } from "react";
import { Pause, Pencil, Play, Plus, Repeat, Trash2, XCircle } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringFormDialog } from "@/components/recurring/recurring-form-dialog";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { FREQUENCY_LABELS, RECURRING_STATUS_LABELS, type RecurringStatus } from "@/constants/finance";
import { useToast } from "@/context/ToastContext";
import { useRecurring, useRecurringMutations } from "@/hooks/use-recurring";
import { errorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { RecurringDTO } from "@/types/finance";

const STATUS_TONE: Record<RecurringStatus, BadgeTone> = { active: "success", paused: "warning", cancelled: "neutral" };

function RecurringRow({ item, onEdit }: { item: RecurringDTO; onEdit: (item: RecurringDTO) => void }) {
  const { update, remove } = useRecurringMutations();
  const { toast, confirm } = useToast();
  const [busy, setBusy] = useState(false);

  const setStatus = async (status: RecurringStatus) => {
    if (status === "cancelled") {
      const ok = await confirm({
        title: "Hủy khoản định kỳ?",
        message: `"${item.name}" sẽ không tự ghi giao dịch nữa. Các giao dịch đã ghi vẫn được giữ lại.`,
        confirmText: "Hủy định kỳ",
        isDestructive: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await update(item.id, { status });
      toast.success(`Đã chuyển sang "${RECURRING_STATUS_LABELS[status]}"`);
    } catch (e) {
      toast.error("Không thể cập nhật", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Xóa khoản định kỳ?",
      message: `Xóa "${item.name}". Các giao dịch đã ghi trước đó vẫn được giữ lại.`,
      confirmText: "Xóa",
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(item.id);
      toast.success("Đã xóa khoản định kỳ");
    } catch (e) {
      toast.error("Không thể xóa", errorMessage(e));
    }
  };

  return (
    <li className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <CategoryIcon icon={item.category.icon} color={item.category.color} />
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
            <span className="truncate">{item.name}</span>
            <Badge tone={STATUS_TONE[item.status]}>{RECURRING_STATUS_LABELS[item.status]}</Badge>
          </p>
          <p className="text-[12px] text-muted">
            {FREQUENCY_LABELS[item.frequency]} · {item.category.name}
            {item.status === "active" && <> · Kỳ tới {formatDate(item.nextRunDate)}</>}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Amount value={item.amount} type={item.type} className="text-sm sm:mr-2" />
        <div className="flex items-center">
          {item.status === "active" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("paused")} disabled={busy} aria-label={`Tạm dừng ${item.name}`} title="Tạm dừng">
              <Pause />
            </Button>
          )}
          {item.status !== "active" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("active")} disabled={busy} aria-label={`Tiếp tục ${item.name}`} title="Tiếp tục">
              <Play />
            </Button>
          )}
          {item.status !== "cancelled" && (
            <Button variant="ghost" size="icon-sm" onClick={() => setStatus("cancelled")} disabled={busy} aria-label={`Hủy ${item.name}`} title="Hủy">
              <XCircle />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(item)} aria-label={`Sửa ${item.name}`} title="Sửa">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleDelete} aria-label={`Xóa ${item.name}`} title="Xóa">
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function RecurringPage() {
  const { data, error, reload } = useRecurring();
  const [dialog, setDialog] = useState<{ item: RecurringDTO | null } | null>(null);

  const fixed = (data ?? []).filter((r) => r.type === "expense" && r.isFixed);
  const others = (data ?? []).filter((r) => !(r.type === "expense" && r.isFixed));
  const fixedMonthly = fixed.filter((r) => r.status === "active").reduce((a, r) => a + r.monthlyEquivalent, 0);
  const incomeMonthly = (data ?? []).filter((r) => r.type === "income" && r.status === "active").reduce((a, r) => a + r.monthlyEquivalent, 0);

  const section = (title: string, description: string, items: RecurringDTO[]) => (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className="pt-1">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <RecurringRow key={item.id} item={item} onEdit={(i) => setDialog({ item: i })} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Định kỳ & chi phí cố định"
        description="Khoản thu chi lặp lại được tự động ghi nhận và dùng để dự báo cuối tháng."
        actions={
          <Button onClick={() => setDialog({ item: null })}>
            <Plus /> Khoản định kỳ mới
          </Button>
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <Card className="px-5">
          <SkeletonRows rows={4} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Repeat />}
            title="Chưa có khoản định kỳ"
            description="Thêm tiền nhà, học phí, Netflix hay tiền trợ cấp hàng tháng để app tự ghi nhận và dự báo chính xác hơn."
            action={
              <Button size="sm" onClick={() => setDialog({ item: null })}>
                <Plus /> Thêm khoản định kỳ
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-[13px] text-muted">Chi phí cố định mỗi tháng</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-foreground">{formatVND(fixedMonthly)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-[13px] text-muted">Thu nhập định kỳ mỗi tháng</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-foreground">{formatVND(incomeMonthly)}</p>
            </Card>
          </div>
          {fixed.length > 0 && section("Chi phí cố định", "Tiền nhà, internet, học phí, điện thoại…", fixed)}
          {others.length > 0 && section("Khoản định kỳ khác", "Thu nhập và các khoản lặp lại không cố định", others)}
        </div>
      )}

      {dialog && <RecurringFormDialog item={dialog.item} onClose={() => setDialog(null)} />}
    </div>
  );
}
