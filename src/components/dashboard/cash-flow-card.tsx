"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { CashFlowBars } from "@/components/charts/cash-flow-bars";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonChart } from "@/components/ui/skeleton";
import { useCashFlow } from "@/hooks/use-dashboard";
import type { CashFlowPreset } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";

const RANGES: { value: CashFlowPreset; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "3m", label: "3 tháng" },
  { value: "6m", label: "6 tháng" },
  { value: "12m", label: "12 tháng" },
];

export function CashFlowCard() {
  const [range, setRange] = useState<CashFlowPreset>("6m");
  const { data, error, reload } = useCashFlow(range);
  const income = data?.reduce((a, p) => a + p.income, 0) ?? 0;
  const expense = data?.reduce((a, p) => a + p.expense, 0) ?? 0;
  const empty = data && income === 0 && expense === 0;

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Dòng tiền"
        description={data && !empty ? `Thu ${formatVND(income)} · Chi ${formatVND(expense)}` : "Thu nhập và chi tiêu theo thời gian"}
        action={
          <div className="max-w-full overflow-x-auto">
            <Segmented label="Khoảng thời gian" value={range} onChange={setRange} options={RANGES} />
          </div>
        }
        className="flex-col sm:flex-row"
      />
      <CardContent>
        {error ? (
          <ErrorState message="Không thể tải dòng tiền." onRetry={reload} />
        ) : !data ? (
          <SkeletonChart />
        ) : empty ? (
          <EmptyState compact icon={<BarChart3 />} title="Chưa có giao dịch trong khoảng này" description="Thêm giao dịch để xem dòng tiền của bạn." />
        ) : (
          <CashFlowBars data={data} />
        )}
      </CardContent>
    </Card>
  );
}
