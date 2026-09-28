"use client";

import { useMemo } from "react";
import { BudgetOverviewCard } from "@/components/dashboard/budget-overview-card";
import { CashFlowCard } from "@/components/dashboard/cash-flow-card";
import { CategoryBreakdownCard } from "@/components/dashboard/category-breakdown-card";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { PlanningCards } from "@/components/dashboard/planning-cards";
import { QuickAddCard } from "@/components/dashboard/quick-add-card";
import { RecentTransactionsCard } from "@/components/dashboard/recent-transactions-card";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { useSessionUser } from "@/components/layout/session-context";
import { useSummary } from "@/hooks/use-dashboard";
import { currentMonthKey } from "@/lib/utils/date";
import { greeting } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

/*
 * Một lưới duy nhất, vị trí từng khối theo kích thước màn hình:
 *
 *   Mobile (1 cột) – ưu tiên quyết định:  số liệu → có thể chi → ghi nhanh → ngân sách → giao dịch gần đây
 *                                          → dòng tiền → danh mục → nhận định
 *   Laptop ≥ 1024 (2 cột):                 số liệu | kế hoạch | dòng tiền (cả hàng) | ngân sách + danh mục
 *                                          | giao dịch gần đây (cả hàng) | nhận định (cả hàng)
 *   Desktop ≥ 1440 (12 cột):               số liệu 12 | dòng tiền 8 + kế hoạch 4 | ngân sách 5 + danh mục 3
 *                                          + gần đây 4 | nhận định 12
 */
const SLOT = {
  summary: "order-1 lg:col-span-2 min-[1440px]:col-span-12",
  planning: "order-2 lg:col-span-2 min-[1440px]:order-3 min-[1440px]:col-span-4",
  quickAdd: "order-3 lg:hidden",
  budget: "order-4 min-[1440px]:col-span-5",
  recent: "order-5 lg:order-7 lg:col-span-2 min-[1440px]:order-6 min-[1440px]:col-span-4",
  cashFlow: "order-6 lg:order-3 lg:col-span-2 min-[1440px]:order-2 min-[1440px]:col-span-8",
  category: "order-7 lg:order-5 min-[1440px]:col-span-3",
  insights: "order-8 lg:col-span-2 min-[1440px]:col-span-12",
};

/** Dashboard: sắp xếp theo mức độ quan trọng – con số chính → kế hoạch → xu hướng → chi tiết. */
export default function DashboardPage() {
  const user = useSessionUser();
  const { t } = useI18n();
  const month = useMemo(() => currentMonthKey(), []);
  const { data: summary } = useSummary(month);
  const firstName = user.name.trim().split(/\s+/).pop() ?? user.name;

  return (
    <div>
      <PageHeader title={`${greeting(t)}, ${firstName}`} description={t.dashboard.subtitle} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-5 min-[1440px]:grid-cols-12">
        <div className={`min-w-0 ${SLOT.summary}`}>
          <SummaryCards summary={summary} />
        </div>
        <div className={`min-w-0 ${SLOT.planning}`}>
          <PlanningCards />
        </div>
        <div className={`min-w-0 ${SLOT.quickAdd}`}>
          <QuickAddCard />
        </div>
        <div className={`min-w-0 ${SLOT.budget}`}>
          <BudgetOverviewCard month={month} />
        </div>
        <div className={`min-w-0 ${SLOT.recent}`}>
          <RecentTransactionsCard />
        </div>
        <div className={`min-w-0 ${SLOT.cashFlow}`}>
          <CashFlowCard />
        </div>
        <div className={`min-w-0 ${SLOT.category}`}>
          <CategoryBreakdownCard month={month} />
        </div>
        <div className={`min-w-0 ${SLOT.insights}`}>
          <InsightsCard />
        </div>
        {/* <GoalsPreviewCard /> – tạm thời tháo mục tiêu tiết kiệm khỏi giao diện dashboard (component vẫn giữ trong code). */}
      </div>
    </div>
  );
}
