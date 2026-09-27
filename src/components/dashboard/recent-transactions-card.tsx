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
import { useI18n } from "@/i18n/provider";

const FILTERS = { pageSize: RECENT_TRANSACTIONS_LIMIT };

export function RecentTransactionsCard() {
  const { data, error, reload } = useTransactions(FILTERS);
  const { openDetail, openCreate } = useTransactionUI();
  const { t } = useI18n();
  const l = t.dashboard.recent;
  const unusual = new Set(data?.unusualIds ?? []);

  return (
    <Card className="min-w-0">
      <CardHeader
        title={l.title}
        action={
          <Link href="/transactions" className="text-[13px] font-medium text-primary-ink hover:underline">
            {t.common.viewAll}
          </Link>
        }
      />
      <CardContent className="px-3 pt-2">
        {error ? (
          <ErrorState message={l.error} onRetry={reload} />
        ) : !data ? (
          <div className="px-2">
            <SkeletonRows rows={5} />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            compact
            icon={<Receipt />}
            title={l.emptyTitle}
            description={l.emptyBody}
            action={
              <Button size="sm" onClick={() => openCreate()}>
                <Plus /> {t.header.addTransaction}
              </Button>
            }
          />
        ) : (
          <div className="space-y-0.5">
            {data.items.map((tx) => (
              <TransactionListItem key={tx.id} tx={tx} unusual={unusual.has(tx.id)} onOpen={(item) => openDetail(item, { unusual: unusual.has(item.id) })} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
