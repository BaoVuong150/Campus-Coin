"use client";

import { useCallback, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { CategoryIcon } from "@/components/common/category-icon";
import { useTransactionUI } from "@/components/transactions/transaction-provider";
import { useDebounce } from "@/hooks/use-debounce";
import { useDismiss } from "@/hooks/use-dismiss";
import { useTransactions } from "@/hooks/use-transactions";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";

const MIN_QUERY = 2;
const RESULT_LIMIT = 6;

/** Tìm nhanh giao dịch theo mô tả hoặc tên danh mục; Enter để xem toàn bộ kết quả. */
export function GlobalSearch({ className }: { className?: string }) {
  const router = useRouter();
  const { openDetail } = useTransactionUI();
  const { t, fmt } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const debounced = useDebounce(query.trim(), 250);
  const enabled = open && debounced.length >= MIN_QUERY;
  const { data, isLoading } = useTransactions(enabled ? { q: debounced, pageSize: RESULT_LIMIT } : null);
  const items = enabled ? (data?.items ?? []) : [];

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);
  useDismiss(ref, open, close);

  const goToAll = () => {
    if (query.trim().length === 0) return;
    router.push(`/transactions?q=${encodeURIComponent(query.trim())}`);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) {
        openDetail(items[active]);
        close();
      } else goToAll();
    }
  };

  return (
    <div ref={ref} className={cn("relative w-full max-w-md", className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        role="combobox"
        aria-expanded={enabled}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={t.header.searchLabel}
        placeholder={t.header.searchPlaceholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-9 w-full rounded-md border border-border bg-surface-secondary pr-3 pl-9 text-sm text-foreground placeholder:text-subtle transition-colors focus:border-primary focus:bg-surface focus:ring-2 focus:ring-ring/25 focus:outline-none"
      />
      {enabled && (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 animate-scale-in overflow-hidden rounded-lg border border-border bg-surface shadow-pop">
          <ul id={listId} role="listbox" aria-label={t.header.searchResults} className="max-h-80 overflow-y-auto py-1">
            {isLoading && <li className="px-3 py-3 text-[13px] text-muted">{t.header.searching}</li>}
            {!isLoading && items.length === 0 && (
              <li className="px-3 py-3 text-[13px] text-muted">{t.header.noResults}</li>
            )}
            {items.map((tx, i) => (
              <li
                key={tx.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  openDetail(tx);
                  close();
                }}
                className={cn("flex cursor-pointer items-center gap-3 px-3 py-2", i === active && "bg-surface-hover")}
              >
                <CategoryIcon icon={tx.category.icon} color={tx.category.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{tx.description}</p>
                  <p className="text-[12px] text-subtle">
                    {fmt.category(tx.category.name)} · {fmt.relativeDay(tx.date)}
                  </p>
                </div>
                <Amount value={tx.amount} type={tx.type} className="text-[13px]" />
              </li>
            ))}
          </ul>
          {items.length > 0 && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                goToAll();
              }}
              className="w-full border-t border-border px-3 py-2 text-left text-[13px] font-medium text-primary hover:bg-surface-hover"
            >
              {t.header.viewAllResults(query.trim())}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
