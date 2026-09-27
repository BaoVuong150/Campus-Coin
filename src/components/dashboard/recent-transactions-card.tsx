"use client";

import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { TransactionListItem } from "@/components/transactions/transaction-list-item";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { RECENT_TRANSACTIONS_LIMIT } from "@/constants/finance";
import { useTransactions } from "@/hooks/use-transactions";

const FILTERS = { pageSize: RECENT_TRANSACTIONS_LIMIT };

export function RecentTransactionsCard() {
  const { data, error, reload } = useTransactions(FILTERS);
  const { openDetail, openCreate } = useTransactionUI();
  const unusual = new Set(data?.unusualIds ?? []);

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Giao dịch gần đây"
        action={
          <Link href="/transactions" className="text-[13px] font-medium text-primary hover:underline">
            Xem tất cả
          </Link>
        }
      />
      <CardContent className="px-3 pt-2">
        {error ? (
          <ErrorState message="Không thể tải giao dịch." onRetry={reload} />
        ) : !data ? (
          <div className="px-2">
            <SkeletonRows rows={5} />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            compact
            icon={<Receipt />}
            title="Chưa có giao dịch nào"
            description="Theo dõi khoản thu chi đầu tiên để bắt đầu."
            action={
              <Button size="sm" onClick={() => openCreate()}>
                <Plus /> Thêm giao dịch
              </Button>
            }
          />
        ) : (
          <div className="space-y-0.5">
            {data.items.map((tx) => (
              <TransactionListItem key={tx.id} tx={tx} unusual={unusual.has(tx.id)} onOpen={(t) => openDetail(t, { unusual: unusual.has(t.id) })} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
