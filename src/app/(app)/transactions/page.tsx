"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileUp, Plus, Receipt, SearchX } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { CsvImportDialog } from "@/components/transactions/csv-import-dialog";
import { TransactionFiltersBar } from "@/components/transactions/transaction-filters";
import { TransactionListItem } from "@/components/transactions/transaction-list-item";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonRows } from "@/components/ui/skeleton";
import { DEFAULT_PAGE_SIZE } from "@/constants/finance";
import { useCategories } from "@/hooks/use-categories";
import { useTransactions, type TransactionFilters } from "@/hooks/use-transactions";
import { apiFetch } from "@/lib/api-client";
import { formatVND } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";
import type { TransactionDTO } from "@/types/finance";

const SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"] as const;

function parseFilters(params: URLSearchParams): TransactionFilters {
  const num = (key: string) => {
    const v = Number(params.get(key));
    return Number.isFinite(v) && v > 0 ? v : null;
  };
  const type = params.get("type");
  const sort = params.get("sort");
  return {
    q: params.get("q") ?? undefined,
    type: type === "income" || type === "expense" ? type : "all",
    category_id: num("category_id"),
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    min: num("min"),
    max: num("max"),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as TransactionFilters["sort"]) : "date_desc",
    page: num("page") ?? 1,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

function TransactionsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(params.toString())), [params]);
  const { data, error, reload, isValidating } = useTransactions(filters);
  const { data: categories } = useCategories();
  const { openCreate, openDetail } = useTransactionUI();
  const { t } = useI18n();
  const l = t.transactions;
  const [importOpen, setImportOpen] = useState(false);
  const unusual = useMemo(() => new Set(data?.unusualIds ?? []), [data]);
  const [resetKey, setResetKey] = useState(0);
  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
    setResetKey((k) => k + 1);
  }, [router, pathname]);

  const update = useCallback(
    (patch: Partial<TransactionFilters>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "" || (key === "type" && value === "all") || (key === "sort" && value === "date_desc")) {
          next.delete(key);
        } else next.set(key, String(value));
      }
      if (!("page" in patch)) next.delete("page");
      next.delete("focus");
      next.delete("search");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  // Mở chi tiết khi đến từ link thông báo (?focus=<id>).
  const focusId = params.get("focus");
  useEffect(() => {
    if (!focusId) return;
    apiFetch<TransactionDTO>(`/api/transactions/${focusId}`)
      .then((tx) => openDetail(tx))
      .catch(() => undefined);
  }, [focusId, openDetail]);

  const open = (tx: TransactionDTO) => openDetail(tx, { unusual: unusual.has(tx.id) });
  const hasFilters = !!(filters.q || filters.type !== "all" || filters.category_id || filters.from || filters.to || filters.min || filters.max);

  return (
    <div>
      <PageHeader
        title={l.title}
        description={l.description}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileUp /> {l.import}
            </Button>
            <Button onClick={() => openCreate()}>
              <Plus /> {l.add}
            </Button>
          </>
        }
      />

      <TransactionFiltersBar
        key={resetKey}
        filters={filters}
        categories={categories ?? []}
        onChange={update}
        onReset={reset}
        autoFocusSearch={params.get("search") === "1"}
      />

      {data && data.total > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted" aria-live="polite">
          <span>
            <span className="tabular font-medium text-foreground">{data.total}</span> {l.count}
          </span>
          <span>
            {t.common.incomeShort} <span className="tabular font-medium text-success">{formatVND(data.totals.income)}</span>
          </span>
          <span>
            {t.common.expenseShort} <span className="tabular font-medium text-danger">{formatVND(data.totals.expense)}</span>
          </span>
        </div>
      )}

      <Card className="mt-3 overflow-hidden">
        {error ? (
          <ErrorState message={l.error} onRetry={reload} />
        ) : !data ? (
          <div className="px-4">
            <SkeletonRows rows={8} />
          </div>
        ) : data.items.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<SearchX />}
              title={l.noMatchTitle}
              description={l.noMatchBody}
              action={
                <Button variant="outline" size="sm" onClick={reset}>
                  {l.clearFilters}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<Receipt />}
              title={l.emptyTitle}
              description={l.emptyBody}
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="sm" onClick={() => openCreate()}>
                    <Plus /> {l.add}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                    <FileUp /> {l.import}
                  </Button>
                </div>
              }
            />
          )
        ) : (
          <div className={isValidating ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <div className="hidden md:block">
              <TransactionTable items={data.items} unusual={unusual} sort={filters.sort ?? "date_desc"} onSort={(sort) => update({ sort })} onOpen={open} />
            </div>
            <div className="space-y-0.5 p-2 md:hidden">
              {data.items.map((tx) => (
                <TransactionListItem key={tx.id} tx={tx} unusual={unusual.has(tx.id)} onOpen={open} />
              ))}
            </div>
          </div>
        )}
        {data && data.total > 0 && (
          <div className="border-t border-border px-4 py-3">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={(page) => update({ page })} />
          </div>
        )}
      </Card>

      {importOpen && <CsvImportDialog open onClose={() => setImportOpen(false)} />}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <TransactionsView />
    </Suspense>
  );
}
