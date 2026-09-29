"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileBarChart, ImageDown, Mail, X } from "lucide-react";
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
import { Input, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useReport } from "@/hooks/use-dashboard";
import { exportReportImage, exportReportPdf } from "@/lib/report-pdf";
import { currentMonthKey, formatDate, parseMonthKey, shiftMonthKey } from "@/lib/utils/date";
import { formatPercent, formatVND } from "@/lib/utils/money";
import { useApi } from "@/hooks/use-api";
import { useCategories } from "@/hooks/use-categories";
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
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);
  // Bộ lọc báo cáo (SRS: lọc theo khoảng ngày, danh mục, nguồn thu). Khoảng ngày hợp lệ ghi đè kỳ tháng/quý/năm.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rangeInvalid = !!from && !!to && from > to;
  const custom = !!from && !!to && !rangeInvalid;
  const filters = { categoryId, from: custom ? from : undefined, to: custom ? to : undefined };
  const { data: categories } = useCategories();
  const { data, error, reload } = useReport(period, anchor, filters);
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
        body: { period, anchor, category_id: categoryId ?? undefined, from: filters.from, to: filters.to },
      });
      toast.success(res.delivery === "sent" ? l.email.sent(res.to) : l.email.savedDev);
    } catch (err) {
      toast.error(l.email.failed, fmt.error(err));
    } finally {
      setEmailing(false);
    }
  };

  const handleExport = async (format: "pdf" | "image") => {
    if (!data || exporting) return;
    setExporting(format);
    try {
      await (format === "pdf" ? exportReportPdf : exportReportImage)(data, user.name, t, fmt);
      toast.success(format === "pdf" ? l.exported : l.exportedImage);
    } catch {
      toast.error(l.exportFailed, t.errors.INTERNAL_ERROR);
    } finally {
      setExporting(null);
    }
  };

  const hasData = !!data && data.totals.transactionCount > 0;
  const periodText = fmt.period(period, anchor);
  const label = custom ? l.filters.custom(formatDate(from), formatDate(to)) : periodText;

  return (
    <div>
      <PageHeader
        title={l.title}
        description={data ? `${label} · ${formatDate(data.from)} – ${formatDate(data.to)}` : l.description}
        actions={
          <>
            {/* Khi lọc theo khoảng ngày tùy chọn, kỳ tháng/quý/năm không còn áp dụng nên ẩn bộ chọn kỳ. */}
            {!custom && (
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
              </>
            )}
            <Button onClick={() => handleExport("pdf")} loading={exporting === "pdf"} disabled={!hasData || !!exporting}>
              <Download /> {l.export}
            </Button>
            <Button variant="outline" onClick={() => handleExport("image")} loading={exporting === "image"} disabled={!hasData || !!exporting}>
              <ImageDown /> {l.exportImage}
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

      <div className="mb-4 grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))_auto] lg:items-end" role="group" aria-label={l.filters.label}>
        <label className="min-w-0 space-y-1.5">
          <span className="text-[12px] font-medium text-muted">{l.filters.category}</span>
          <Select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{l.filters.allCategories}</option>
            <optgroup label={l.filters.incomeGroup}>
              {(categories ?? []).filter((c) => c.type === "income").map((c) => (
                <option key={c.id} value={c.id}>{fmt.category(c.name)}</option>
              ))}
            </optgroup>
            <optgroup label={l.filters.expenseGroup}>
              {(categories ?? []).filter((c) => c.type === "expense").map((c) => (
                <option key={c.id} value={c.id}>{fmt.category(c.name)}</option>
              ))}
            </optgroup>
          </Select>
        </label>
        <label className="min-w-0 space-y-1.5">
          <span className="text-[12px] font-medium text-muted">{l.filters.from}</span>
          <Input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="min-w-0 space-y-1.5">
          <span className="text-[12px] font-medium text-muted">{l.filters.to}</span>
          <Input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-invalid={rangeInvalid || undefined} />
        </label>
        {(categoryId || from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setCategoryId(null);
              setFrom("");
              setTo("");
            }}
          >
            <X /> {l.filters.clear}
          </Button>
        )}
        {rangeInvalid && <p className="text-[12px] text-danger sm:col-span-2 lg:col-span-4">{l.filters.invalidRange}</p>}
      </div>

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
            <CardHeader title={l.trend} description={data.trend[0]?.key.length === 10 ? l.byDay : l.byMonth} />
            <CardContent>
              <CashFlowBars data={data.trend} />
            </CardContent>
          </Card>

          {data.weekly.length > 0 && (
            <Card>
              <CardHeader title={l.weekly.title} description={l.weekly.description} />
              <CardContent>
                <ul className="divide-y divide-border">
                  {data.weekly.map((w) => (
                    <li key={w.start} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                      <span className="text-muted">{l.weekly.week(formatDate(w.start), formatDate(w.end))}</span>
                      <span className="tabular flex gap-4">
                        <span className="text-success">+{formatVND(w.income)}</span>
                        <span className="text-foreground">−{formatVND(w.expense)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

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
