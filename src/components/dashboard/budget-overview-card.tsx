"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { BudgetRow } from "@/components/budgets/budget-row";
import { EmptyState, ErrorState } from "@/components/common/states";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useBudgets } from "@/hooks/use-budget";

const PREVIEW = 4;

export function BudgetOverviewCard({ month }: { month: string }) {
  const { data, error, reload } = useBudgets(month);
  return (
    <Card className="min-w-0">
      <CardHeader
        title="Ngân sách tháng"
        action={
          <Link href="/budgets" className="text-[13px] font-medium text-primary hover:underline">
            Quản lý
          </Link>
        }
      />
      <CardContent className="pt-2">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.items.length === 0 ? (
          <EmptyState
            compact
            icon={<Wallet />}
            title="Bạn chưa đặt ngân sách"
            description="Đặt hạn mức cho từng danh mục để nhận cảnh báo khi sắp tiêu quá tay."
            action={
              <Link href="/budgets" className={buttonClasses("primary", "sm")}>
                Đặt ngân sách
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {data.items.slice(0, PREVIEW).map((item) => (
              <BudgetRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
