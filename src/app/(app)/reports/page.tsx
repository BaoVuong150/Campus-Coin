"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileBarChart } from "lucide-react";
import { BudgetRow } from "@/components/budgets/budget-row";
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
    <Card className="p-4">
      <p className="text-[12px] text-muted">{label}</p>
      <p className={`tabular mt-1 text-lg font-semibold tracking-tight ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-foreground"}`}>{value}</p>
    </Card>
  );
}

export default function ReportsPage() {
  const user = useSessionUser();
  const { toast } = useToast();
  const { openDetail } = useTransactionUI();
  const colors = useChartColors();
  const order = useExpenseCategoryOrder();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchor, setAnchor] = useState(currentMonthKey());
  const [exporting, setExporting] = useState(false);
  const { data, error, reload } = useReport(period, anchor);
  const slices = useMemo(() => buildSlices(data?.categories ?? [], order, colors.series, colors.other), [data, order, colors]);
  const current = currentMonthKey();
  const canNext = periodIndex(period, shiftMonthKey(anchor, STEP[period])) <= periodIndex(period, current);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportReportPdf(data, user.name);
      toast.success("Đã xuất báo cáo PDF");
    } catch {
      toast.error("Không thể xuất PDF", "Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  const hasData = !!data && data.totals.transactionCount > 0;

  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description={data ? `${data.label} · ${data.from} – ${data.to}` : "Phân tích thu chi theo kỳ."}
        actions={
          <>
            <Segmented
              label="Kỳ báo cáo"
              value={period}
              onChange={(p) => {
                setPeriod(p);
                setAnchor(current);
              }}
              options={[
                { value: "month", label: "Tháng" },
                { value: "quarter", label: "Quý" },
                { value: "year", label: "Năm" },
              ]}
              size="md"
            />
            <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
              <Button variant="ghost" size="icon-sm" onClick={() => setAnchor(shiftMonthKey(anchor, -STEP[period]))} aria-label="Kỳ trước">
                <ChevronLeft />
              </Button>
              <span className="min-w-24 text-center text-sm font-medium text-foreground">{data?.label ?? "…"}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setAnchor(shiftMonthKey(anchor, STEP[period]))} disabled={!canNext} aria-label="Kỳ sau">
                <ChevronRight />
              </Button>
            </div>
            <Button onClick={handleExport} loading={exporting} disabled={!hasData}>
              <Download /> Xuất PDF
            </Button>
          </>
        }
      />

      {error ? (
        <Card>
          <ErrorState message="Không thể tải báo cáo." onRetry={reload} />
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
          <EmptyState icon={<FileBarChart />} title="Không có giao dịch trong kỳ này" description="Chọn kỳ khác hoặc thêm giao dịch để xem báo cáo." />
        </Card>
      ) : (
        <div className="space-y-4">
          <section aria-label="Tóm tắt tài chính" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Tổng thu" value={formatVND(data.totals.income)} />
            <Kpi label="Tổng chi" value={formatVND(data.totals.expense)} />
            <Kpi label="Chênh lệch" value={`${data.totals.net < 0 ? "− " : "+ "}${formatVND(Math.abs(data.totals.net))}`} tone={data.totals.net < 0 ? "danger" : "success"} />
            <Kpi label="Chi trung bình / ngày" value={formatVND(data.totals.averageDailySpend)} />
          </section>

          <Card>
            <CardHeader title="Thu nhập và chi tiêu" description={period === "month" ? "Theo ngày" : "Theo tháng"} />
            <CardContent>
              <CashFlowBars data={data.trend} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title="Chi tiêu theo danh mục" />
              <CardContent>
                {data.categories.length === 0 ? (
                  <p className="text-[13px] text-muted">Không có khoản chi trong kỳ.</p>
                ) : (
                  <CategoryDonut slices={slices} total={data.totals.expense} />
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title="Danh mục chi nhiều nhất" />
              <CardContent className="pt-2">
                <table className="w-full text-sm">
                  <caption className="sr-only">Danh mục chi nhiều nhất</caption>
                  <thead className="text-left text-[12px] text-muted">
                    <tr>
                      <th scope="col" className="py-2 font-medium">Danh mục</th>
                      <th scope="col" className="py-2 text-right font-medium">Tỷ trọng</th>
                      <th scope="col" className="py-2 text-right font-medium">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.categories.slice(0, 6).map((c) => (
                      <tr key={c.categoryId}>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2.5">
                            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                            <span className="truncate text-foreground">{c.name}</span>
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
              <CardHeader title="Giao dịch chi lớn nhất" />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {data.largestTransactions.map((t) => (
                    <li key={t.id}>
                      <button type="button" onClick={() => openDetail(t)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-hover">
                        <CategoryIcon icon={t.category.icon} color={t.category.color} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-foreground">{t.description}</span>
                          <span className="block text-[12px] text-subtle">
                            {t.category.name} · {formatDate(t.date)}
                          </span>
                        </span>
                        <Amount value={t.amount} type={t.type} className="text-sm" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title="Hiệu quả ngân sách" />
              <CardContent className="pt-1">
                {data.budgetPerformance.length === 0 ? (
                  <p className="text-[13px] text-muted">Chưa đặt ngân sách trong kỳ này.</p>
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
    </div>
  );
}
