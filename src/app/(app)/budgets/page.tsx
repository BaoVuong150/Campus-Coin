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
import { currentMonthKey, isValidMonthKey, shiftMonthKey } from "@/lib/utils/date";
import { useI18n } from "@/i18n/provider";
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
  const { t, fmt } = useI18n();
  const l = t.budgets;
  const monthName = fmt.month(month);
  const [dialog, setDialog] = useState<{ key: number; editing: BudgetItemDTO | null } | null>(null);
  const [copying, setCopying] = useState(false);

  const setMonth = (m: string) => router.replace(m === currentMonthKey() ? pathname : `${pathname}?month=${m}`, { scroll: false });
  const openDialog = (editing: BudgetItemDTO | null) => setDialog({ key: Date.now(), editing });

  const handleDelete = async (item: BudgetItemDTO) => {
    const ok = await confirm({
      title: l.deleteTitle,
      message: l.deleteMessage(fmt.category(item.category.name), monthName),
      confirmText: l.deleteConfirm,
      isDestructive: true,
    });
    if (!ok) return;
    try {
      await remove(item.id);
      toast.success(l.deleted);
    } catch (e) {
      toast.error(l.deleteFailed, fmt.error(e));
    }
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      const copied = await copy(shiftMonthKey(month, -1), month);
      if (copied > 0) toast.success(l.copied(copied));
      else toast.info(l.nothingToCopy);
    } catch (e) {
      toast.error(l.copyFailed, fmt.error(e));
    } finally {
      setCopying(false);
    }
  };

  const totals = data?.totals;
  const overCount = data?.items.filter((i) => i.status === "exceeded").length ?? 0;

  return (
    <div>
      <PageHeader
        title={l.title}
        description={l.description}
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button onClick={() => openDialog(null)}>
              <Plus /> {l.add}
            </Button>
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={l.error} onRetry={reload} />
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
            title={l.emptyTitle}
            description={l.emptyBody(monthName)}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={() => openDialog(null)}>
                  <Plus /> {l.add}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy} loading={copying}>
                  <Copy /> {l.copy}
                </Button>
              </div>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label={l.total} value={formatVND(totals!.limit)} />
              <Stat label={l.spent} value={formatVND(totals!.spent)} />
              <Stat label={l.remaining} value={formatVND(totals!.remaining)} />
              <Stat label={l.used} value={`${totals!.percentage}%`} tone={totals!.percentage > 100 ? "danger" : undefined} />
            </div>
            <Progress
              className="mt-4"
              value={totals!.percentage}
              tone={totals!.percentage > 100 ? "danger" : totals!.percentage >= 80 ? "warning" : "primary"}
              label={l.totalUsed}
            />
            {overCount > 0 && (
              <p className="mt-3 text-[13px] text-danger">
                {l.overCount(overCount, monthName)}
              </p>
            )}
          </Card>

          <Card>
            <CardHeader title={l.byCategory} description={l.categoriesCount(data.items.length)} />
            <CardContent className="divide-y divide-border pt-1">
              {data.items.map((item) => (
                <BudgetRow
                  key={item.id}
                  item={item}
                  actions={
                    <div className="flex shrink-0 items-center">
                      <Button variant="ghost" size="icon-sm" onClick={() => openDialog(item)} aria-label={l.editLabel(fmt.category(item.category.name))}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} aria-label={l.deleteLabel(fmt.category(item.category.name))}>
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
