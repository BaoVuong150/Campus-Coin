"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Landmark, TrendingDown, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/provider";
import { formatPercent, formatVND, percentChange } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { SummaryDTO } from "@/types/finance";

interface ChangeProps {
  current: number;
  previous: number;
  /** true nếu tăng là tốt (thu nhập, số dư); false nếu giảm là tốt (chi tiêu). */
  higherIsBetter: boolean;
}

/** Mức thay đổi coi như "không đổi" (%). */
const FLAT_THRESHOLD = 0.05;

function Change({ current, previous, higherIsBetter }: ChangeProps) {
  const { t } = useI18n();
  const change = percentChange(current, previous);
  if (change === null) return <p className="text-[12px] text-subtle">{t.dashboard.summary.noPrevious}</p>;
  const up = change >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const tone = Math.abs(change) < FLAT_THRESHOLD ? "text-muted" : up === higherIsBetter ? "text-success" : "text-danger";
  return (
    <p className="flex items-center gap-1 text-[12px] text-muted">
      <span className={cn("inline-flex items-center font-medium", tone)}>
        <Icon className="size-3.5" aria-hidden />
        <span className="sr-only">{up ? t.dashboard.summary.increase : t.dashboard.summary.decrease}</span>
        {formatPercent(Math.abs(change))}
      </span>
      {t.dashboard.summary.vsLastMonth}
    </p>
  );
}

interface StatCardProps {
  label: string;
  icon: LucideIcon;
  value: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Thẻ số liệu. Cỡ số tính theo chiều rộng chính thẻ (cqi) nên thẻ nửa màn hình trên điện thoại
 * vẫn hiển thị trọn "12.500.000 ₫" mà không tràn hay xuống dòng.
 */
function StatCard({ label, icon: Icon, value, className, children }: StatCardProps) {
  return (
    <Card className={cn("@container flex min-w-0 flex-col gap-2 p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-medium text-muted">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-md bg-surface-secondary text-subtle" aria-hidden>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tabular text-[clamp(17px,12cqi,26px)] leading-tight font-semibold tracking-tight whitespace-nowrap text-foreground">{value}</p>
      {children}
    </Card>
  );
}

/** Điện thoại: số dư và ngân sách cả hàng, thu / chi cạnh nhau; tablet 2 × 2; từ 1280px một hàng 4 thẻ. */
const GRID = "grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4";
const WIDE_ON_PHONE = "col-span-2 sm:col-span-1";

export function SummaryCards({ summary }: { summary: SummaryDTO | undefined }) {
  const { t } = useI18n();
  const s = t.dashboard.summary;

  if (!summary) {
    return (
      <div className={GRID}>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className={i === 0 || i === 3 ? WIDE_ON_PHONE : undefined} />
        ))}
      </div>
    );
  }

  const used = summary.budget?.percentage ?? 0;
  return (
    <div className={GRID}>
      <StatCard label={s.balance} icon={Landmark} value={formatVND(summary.balance)} className={WIDE_ON_PHONE}>
        <Change current={summary.balance} previous={summary.previousBalance} higherIsBetter />
      </StatCard>
      <StatCard label={s.income} icon={TrendingUp} value={formatVND(summary.income)}>
        <Change current={summary.income} previous={summary.previousIncome} higherIsBetter />
      </StatCard>
      <StatCard label={s.expense} icon={TrendingDown} value={formatVND(summary.expense)}>
        <Change current={summary.expense} previous={summary.previousExpense} higherIsBetter={false} />
      </StatCard>
      <StatCard label={s.budgetLeft} icon={Wallet} value={summary.budget ? formatVND(summary.budget.remaining) : "—"} className={WIDE_ON_PHONE}>
        {summary.budget ? (
          <div className="space-y-1.5">
            <Progress value={used} tone={used > 100 ? "danger" : used >= 80 ? "warning" : "primary"} label={s.budgetUsedLabel} size="sm" />
            <p className="text-[12px] text-muted">{s.budgetUsed(used, formatVND(summary.budget.limit))}</p>
          </div>
        ) : (
          <Link href="/budgets" className="text-[12px] font-medium text-primary-ink hover:underline">
            {s.setBudget}
          </Link>
        )}
      </StatCard>
    </div>
  );
}
