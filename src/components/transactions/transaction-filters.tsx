"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { CategoryDTO } from "@/types/finance";
import type { TransactionFilters as Filters } from "@/hooks/use-transactions";
import { useI18n } from "@/i18n/provider";
import { transactionTypeOptions } from "@/i18n/format";

interface Props {
  filters: Filters;
  categories: CategoryDTO[];
  onChange: (patch: Partial<Filters>) => void;
  onReset: () => void;
  autoFocusSearch?: boolean;
}

export function TransactionFiltersBar({ filters, categories, onChange, onReset, autoFocusSearch }: Props) {
  const { t, fmt } = useI18n();
  const l = t.transactions.filters;
  const typeOptions = [{ value: "all" as const, label: t.common.all }, ...transactionTypeOptions(t)];
  const [q, setQ] = useState(filters.q ?? "");
  const [min, setMin] = useState(filters.min ? formatCurrencyInput(filters.min) : "");
  const [max, setMax] = useState(filters.max ? formatCurrencyInput(filters.max) : "");
  const [expanded, setExpanded] = useState(!!(filters.from || filters.to || filters.min || filters.max || filters.category_id));
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedQ = useDebounce(q, 300);
  const debouncedMin = useDebounce(min, 500);
  const debouncedMax = useDebounce(max, 500);

  useEffect(() => {
    if (autoFocusSearch) searchRef.current?.focus();
  }, [autoFocusSearch]);

  useEffect(() => {
    if ((filters.q ?? "") !== debouncedQ) onChange({ q: debouncedQ || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đồng bộ khi giá trị đã debounce thay đổi
  }, [debouncedQ]);

  // Đồng bộ khi từ khóa thay đổi từ bên ngoài (ví dụ ô tìm kiếm trên header).
  const [urlQ, setUrlQ] = useState(filters.q ?? "");
  if ((filters.q ?? "") !== urlQ) {
    setUrlQ(filters.q ?? "");
    if ((filters.q ?? "") !== debouncedQ) setQ(filters.q ?? "");
  }

  useEffect(() => {
    const minValue = parseCurrencyInput(debouncedMin) || null;
    const maxValue = parseCurrencyInput(debouncedMax) || null;
    if ((filters.min ?? null) !== minValue || (filters.max ?? null) !== maxValue) onChange({ min: minValue, max: maxValue });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- như trên
  }, [debouncedMin, debouncedMax]);

  const visibleCategories = categories.filter((c) => filters.type === "all" || !filters.type || c.type === filters.type);
  const activeCount = [filters.category_id, filters.from, filters.to, filters.min, filters.max].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            ref={searchRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={l.search}
            aria-label={t.header.searchLabel}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            label={l.type}
            value={filters.type ?? "all"}
            onChange={(type) => onChange({ type, category_id: null })}
            options={typeOptions}
            size="md"
          />
          <Button variant={expanded ? "secondary" : "outline"} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} aria-controls="tx-advanced-filters">
            <SlidersHorizontal /> {l.button}
            {activeCount > 0 && <span className="tabular rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground">{activeCount}</span>}
          </Button>
        </div>
      </div>

      <div id="tx-advanced-filters" className={cn("grid gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-5", !expanded && "hidden")}>
        <label className="space-y-1">
          <span className="text-[12px] font-medium text-muted">{l.category}</span>
          <Select value={filters.category_id ?? ""} onChange={(e) => onChange({ category_id: e.target.value ? Number(e.target.value) : null })}>
            <option value="">{l.allCategories}</option>
            {visibleCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {fmt.category(c.name)}
              </option>
            ))}
          </Select>
        </label>
        <label className="space-y-1">
          <span className="text-[12px] font-medium text-muted">{l.from}</span>
          <Input type="date" value={filters.from ?? ""} onChange={(e) => onChange({ from: e.target.value || undefined })} />
        </label>
        <label className="space-y-1">
          <span className="text-[12px] font-medium text-muted">{l.to}</span>
          <Input type="date" value={filters.to ?? ""} min={filters.from} onChange={(e) => onChange({ to: e.target.value || undefined })} />
        </label>
        <label className="space-y-1">
          <span className="text-[12px] font-medium text-muted">{l.min}</span>
          <MoneyInput value={min} onValueChange={setMin} placeholder="0" />
        </label>
        <label className="space-y-1">
          <span className="text-[12px] font-medium text-muted">{l.max}</span>
          <MoneyInput value={max} onValueChange={setMax} placeholder={l.noLimit} />
        </label>
        {activeCount > 0 && (
          <div className="sm:col-span-2 lg:col-span-5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ("");
                setMin("");
                setMax("");
                onReset();
              }}
            >
              <X /> {t.transactions.clearFilters}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
