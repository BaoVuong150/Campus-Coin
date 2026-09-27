"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PieChart } from "lucide-react";
import { buildSlices, CategoryDonut } from "@/components/charts/category-donut";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/hooks/use-categories";
import { useChartColors } from "@/hooks/use-chart-colors";
import { useCategoryBreakdown } from "@/hooks/use-dashboard";
import { monthLabel, monthRange, toYmd } from "@/lib/utils/date";

/** Thứ tự cố định của danh mục chi để gán màu theo danh mục (không theo thứ hạng). */
export function useExpenseCategoryOrder(): number[] {
  const { data } = useCategories();
  return useMemo(() => (data ?? []).filter((c) => c.type === "expense").map((c) => c.id), [data]);
}

export function CategoryBreakdownCard({ month }: { month: string }) {
  const router = useRouter();
  const colors = useChartColors();
  const order = useExpenseCategoryOrder();
  const { data, error, reload } = useCategoryBreakdown(month);
  const slices = useMemo(() => buildSlices(data ?? [], order, colors.series, colors.other), [data, order, colors]);
  const total = (data ?? []).reduce((a, b) => a + b.amount, 0);

  const range = monthRange(month);
  const from = toYmd(range.start);
  const to = toYmd(new Date(range.end.getTime() - 1));

  return (
    <Card className="min-w-0">
      <CardHeader title="Chi tiêu theo danh mục" description={monthLabel(month)} />
      <CardContent>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="flex items-center gap-5">
            <Skeleton className="size-44 rounded-full" />
            <div className="flex-1 space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>
          </div>
        ) : data.length === 0 ? (
          <EmptyState compact icon={<PieChart />} title="Chưa có khoản chi nào" description="Chi tiêu tháng này sẽ được phân tích theo danh mục tại đây." />
        ) : (
          <CategoryDonut
            slices={slices}
            total={total}
            onSelect={(s) => router.push(`/transactions?type=expense&category_id=${s.categoryId}&from=${from}&to=${to}`)}
          />
        )}
      </CardContent>
    </Card>
  );
}
