"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetRow } from "@/components/budgets/budget-row";
import { MonthPicker } from "@/components/common/month-picker";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard, SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useBudgetMutations, useBudgets } from "@/hooks/use-budget";
import { useCategories } from "@/hooks/use-categories";
import { errorMessage } from "@/lib/api-client";
import { currentMonthKey, isValidMonthKey, monthLabel, shiftMonthKey } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { BudgetItemDTO } from "@/types/finance";

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div>
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`tabular mt-0.5 text-xl font-semibold tracking-tight ${tone === "danger" ? "text-danger" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function BudgetsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const monthParam = params.get("month") ?? "";
  const month = isValidMonthKey(monthParam) ? monthParam : currentMonthKey();
  const { data, error, reload } = useBudgets(month);
  const { data: categories } = useCategories();
  const { remove, copy } = useBudgetMutations();
  const { toast, confirm } = useToast();
  const [dialog, setDialog] = useState<{ key: number; editing: BudgetItemDTO | null } | null>(null);
  const [copying, setCopying] = useState(false);

  const setMonth = (m: string) => router.replace(m === currentMonthKey() ? pathname : `${pathname}?month=${m}`, { scroll: false });
  const openDialog = (editing: BudgetItemDTO | null) => setDialog({ key: Date.now(), editing });

  const handleDelete = async (item: BudgetItemDTO) => {
    const ok = await confirm({
      title: "Xóa ngân sách?",
      message: `Ngân sách ${item.category.name} của ${monthLabel(month).toLowerCase()} sẽ bị xóa. Giao dịch không bị ảnh hưởng.`,
      confirmText: "Xóa ngân sách",
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(item.id);
      toast.success("Đã xóa ngân sách");
    } catch (e) {
      toast.error("Không thể xóa ngân sách", errorMessage(e));
    }
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      const copied = await copy(shiftMonthKey(month, -1), month);
      if (copied > 0) toast.success(`Đã sao chép ${copied} ngân sách từ tháng trước`);
      else toast.info("Tháng trước chưa có ngân sách để sao chép");
    } catch (e) {
      toast.error("Không thể sao chép", errorMessage(e));
    } finally {
      setCopying(false);
    }
  };

  const totals = data?.totals;
  const overCount = data?.items.filter((i) => i.status === "exceeded").length ?? 0;

  return (
    <div>
      <PageHeader
        title="Ngân sách"
        description="Đặt hạn mức cho từng danh mục chi tiêu và theo dõi mức sử dụng."
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button onClick={() => openDialog(null)}>
              <Plus /> Thêm ngân sách
            </Button>
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState message="Không thể tải ngân sách." onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <Card className="px-5">
            <SkeletonRows rows={4} />
          </Card>
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet />}
            title="Bạn chưa đặt ngân sách"
            description={`Đặt hạn mức cho ${monthLabel(month).toLowerCase()} để nhận cảnh báo khi sắp tiêu quá tay.`}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => openDialog(null)}>
                  <Plus /> Thêm ngân sách
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} loading={copying}>
                  <Copy /> Sao chép từ tháng trước
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Tổng ngân sách" value={formatVND(totals!.limit)} />
              <Stat label="Đã chi" value={formatVND(totals!.spent)} />
              <Stat label="Còn lại" value={formatVND(totals!.remaining)} />
              <Stat label="Đã dùng" value={`${totals!.percentage}%`} tone={totals!.percentage > 100 ? "danger" : undefined} />
            </div>
            <Progress
              className="mt-4"
              value={totals!.percentage}
              tone={totals!.percentage > 100 ? "danger" : totals!.percentage >= 80 ? "warning" : "primary"}
              label="Tổng ngân sách đã dùng"
            />
            {overCount > 0 && (
              <p className="mt-3 text-[13px] text-danger">
                {overCount} danh mục đã vượt ngân sách trong {monthLabel(month).toLowerCase()}.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title="Theo danh mục" description={`${data.items.length} danh mục có ngân sách`} />
            <CardContent className="divide-y divide-border pt-1">
              {data.items.map((item) => (
                <BudgetRow
                  key={item.id}
                  item={item}
                  actions={
                    <div className="flex shrink-0 items-center">
                      <Button variant="ghost" size="icon-sm" onClick={() => openDialog(item)} aria-label={`Sửa ngân sách ${item.category.name}`}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} aria-label={`Xóa ngân sách ${item.category.name}`}>
                        <Trash2 />
                      </Button>
                    </div>
                  }
                />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {dialog && (
        <BudgetFormDialog
          key={dialog.key}
          open
          onClose={() => setDialog(null)}
          month={month}
          categories={categories ?? []}
          existing={data?.items ?? []}
          editing={dialog.editing}
        />
      )}
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<SkeletonCard lines={3} />}>
      <BudgetsView />
    </Suspense>
  );
}
