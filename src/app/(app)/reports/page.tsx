"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileBarChart, Mail } from "lucide-react";
import { BudgetRow } from "@/components/budgets/budget-row";
import { InsightHistoryCard } from "@/components/reports/insight-history-card";
import { buildSlices, CategoryDonut } from "@/components/charts/category-donut";
import { CashFlowBars } from "@/components/charts/cash-flow-bars";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { EmptyState, ErrorState } from "@/components/common/states";
import { useExpenseCategoryOrder } from "@/components/dashboard/category-breakdown-card";
import { PageHeader } from "@/components/layout/page-header";
import { useSessionUser } from "@/components/layout/session-context";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useReport } from "@/hooks/use-dashboard";
import { exportReportPdf } from "@/lib/report-pdf";
import { currentMonthKey, formatDate, parseMonthKey, shiftMonthKey } from "@/lib/utils/date";
import { formatPercent, formatVND } from "@/lib/utils/money";
import { useApi } from "@/hooks/use-api";
import { useI18n } from "@/i18n/provider";
import { apiFetch } from "@/lib/api-client";
import type { BudgetItemDTO, ReportPeriod } from "@/types/finance";

const STEP: Record<ReportPeriod, number> = { month: 1, quarter: 3, year: 12 };

/** Chỉ số tuyến tính của kỳ để so sánh (không cho chọn kỳ tương lai). */
function periodIndex(period: ReportPeriod, monthKey: string): number {
  const { year, month } = parseMonthKey(monthKey);
  if (period === "year") return year;
  if (period === "quarter") return year * 4 + Math.ceil(month / 3);
  return year * 12 + month;
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  return (
    // Cỡ số theo chiều rộng thẻ: thẻ nửa màn hình trên điện thoại vẫn giữ số tiền trên một dòng.
    <Card className="@container min-w-0 p-4">
      <p className="truncate text-[13px] text-muted">{label}</p>
      <p className={`tabular mt-1 text-[clamp(15px,11cqi,20px)] font-semibold tracking-tight whitespace-nowrap ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground"}`}>{value}</p>
    </Card>
  );
}

export default function ReportsPage() {
  const user = useSessionUser();
  const { toast } = useToast();
  const { openDetail } = useTransactionUI();
  const { t, fmt } = useI18n();
  const l = t.reports;
  const colors = useChartColors();
  const order = useExpenseCategoryOrder();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchor, setAnchor] = useState(currentMonthKey());
  const [exporting, setExporting] = useState(false);
  const { data, error, reload } = useReport(period, anchor);
  const slices = useMemo(() => buildSlices(data?.categories ?? [], order, colors.series, colors.other), [data, order, colors]);
  const current = currentMonthKey();
  const canNext = periodIndex(period, shiftMonthKey(anchor, STEP[period])) <= periodIndex(period, current);

  const { data: emailEnabled } = useApi<{ enabled: boolean }>("/api/reports/email");
  const [emailing, setEmailing] = useState(false);
  const handleEmail = async () => {
    if (emailing) return;
    setEmailing(true);
    try {
      const res = await apiFetch<{ delivery: "sent" | "saved_locally"; to: string }>("/api/reports/email", {
        method: "POST",
        body: { period, anchor },
      });
      toast.success(res.delivery === "sent" ? l.email.sent(res.to) : l.email.savedDev);
    } catch (err) {
      toast.error(l.email.failed, fmt.error(err));
    } finally {
      setEmailing(false);
    }
  };

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportReportPdf(data, user.name, t, fmt);
      toast.success(l.exported);
    } catch {
      toast.error(l.exportFailed, t.errors.INTERNAL_ERROR);
    } finally {
      setExporting(false);
    }
  };

  const hasData = !!data && data.totals.transactionCount > 0;
  const label = fmt.period(period, anchor);

  return (
    <div>
      <PageHeader
        title={l.title}
        description={data ? `${label} · ${formatDate(data.from)} – ${formatDate(data.to)}` : l.description}
        actions={
          <>
            <Segmented
              label={l.period}
              value={period}
              onChange={(p) => {
                setPeriod(p);
                setAnchor(current);
              }}
              options={[
                { value: "month", label: l.periods.month },
                { value: "quarter", label: l.periods.quarter },
                { value: "year", label: l.periods.year },
              ]}
              size="md"
            />
            <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => setAnchor(shiftMonthKey(anchor, -STEP[period]))} aria-label={l.prev}>
                <ChevronLeft />
              </Button>
              <span className="min-w-24 text-center text-sm font-medium text-foreground">{label}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setAnchor(shiftMonthKey(anchor, STEP[period]))} disabled={!canNext} aria-label={l.next}>
                <ChevronRight />
              </Button>
            </div>
            <Button onClick={handleExport} loading={exporting} disabled={!hasData}>
              <Download /> {l.export}
            </Button>
            {/* Chỉ hiện khi hệ thống thực sự gửi được email (production đã cấu hình Resend). */}
            {emailEnabled?.enabled && (
              <Button variant="outline" onClick={handleEmail} loading={emailing} disabled={!hasData}>
                <Mail /> {l.email.send}
              </Button>
            )}
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState message={l.error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
          <Card className="p-5">
            <SkeletonChart />
          </Card>
        </div>
      ) : !hasData ? (
        <Card>
          <EmptyState icon={<FileBarChart />} title={l.emptyTitle} description={l.emptyBody} />
        </Card>
      ) : (
        <div className="space-y-4">
          <section aria-label={l.summaryLabel} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label={l.income} value={formatVND(data.totals.income)} />
            <Kpi label={l.expense} value={formatVND(data.totals.expense)} />
            <Kpi label={l.net} value={`${data.totals.net < 0 ? "− " : "+ "}${formatVND(Math.abs(data.totals.net))}`} tone={data.totals.net < 0 ? "danger" : "success"} />
            <Kpi label={l.avgDaily} value={formatVND(data.totals.averageDailySpend)} />
          </section>

          <Card>
            <CardHeader title={l.trend} description={period === "month" ? l.byDay : l.byMonth} />
            <CardContent>
              <CashFlowBars data={data.trend} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title={l.categories} />
              <CardContent>
                {data.categories.length === 0 ? (
                  <p className="text-[13px] text-muted">{l.noExpense}</p>
                ) : (
                  <CategoryDonut slices={slices} total={data.totals.expense} />
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title={l.topCategories} />
              <CardContent className="pt-2">
                <table className="w-full text-sm">
                  <caption className="sr-only">{l.topCategories}</caption>
                  <thead className="text-left text-[12px] text-muted">
                    <tr>
                      <th scope="col" className="py-2 font-medium">{t.transactions.table.category}</th>
                      <th scope="col" className="py-2 text-right font-medium">{l.share}</th>
                      <th scope="col" className="py-2 text-right font-medium">{t.transactions.table.amount}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.categories.slice(0, 6).map((c) => (
                      <tr key={c.categoryId}>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2.5">
                            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                            <span className="truncate text-foreground">{fmt.category(c.name)}</span>
                          </span>
                        </td>
                        <td className="tabular py-2.5 text-right text-muted">{formatPercent(c.percentage, 0)}</td>
                        <td className="tabular py-2.5 text-right font-medium text-foreground">{formatVND(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title={l.largest} />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {data.largestTransactions.map((tx) => (
                    <li key={tx.id}>
                      <button type="button" onClick={() => openDetail(tx)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-hover">
                        <CategoryIcon icon={tx.category.icon} color={tx.category.color} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{tx.description}</span>
                          <span className="block text-[12px] text-subtle">
                            {fmt.category(tx.category.name)} · {formatDate(tx.date)}
                          </span>
                        </span>
                        <Amount value={tx.amount} type={tx.type} className="text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title={l.budgetPerformance} />
              <CardContent className="pt-1">
                {data.budgetPerformance.length === 0 ? (
                  <p className="text-[13px] text-muted">{l.noBudget}</p>
                ) : (
                  <div className="divide-y divide-border">
                    {data.budgetPerformance.map((b) => {
                      const item = {
                        id: 0,
                        month: anchor,
                        categoryId: 0,
                        category: { id: 0, name: b.categoryName, type: "expense", icon: null, color: null, isDefault: true },
                        limit: b.limit,
                        spent: b.spent,
                        remaining: Math.max(0, b.limit - b.spent),
                        overBy: Math.max(0, b.spent - b.limit),
                        percentage: b.percentage,
                        status: b.spent > b.limit ? "exceeded" : b.percentage >= 80 ? "warning" : "normal",
                      } satisfies BudgetItemDTO;
                      return <BudgetRow key={b.categoryName} item={item} />;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Nhận định đã lưu các tháng trước – độc lập với kỳ báo cáo đang chọn. */}
      <div className="mt-4">
        <InsightHistoryCard />
      </div>
    </div>
  );
}
