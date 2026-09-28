"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, Coins, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Segmented } from "@/components/ui/segmented";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils/date";
import { formatCurrencyInput, formatVND, parseCurrencyInput } from "@/lib/utils/money";
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

/** Từ 768px bộ lọc nâng cao mở ngay trong trang; nhỏ hơn mở dạng bottom sheet (cùng một bộ trường). */
const INLINE_FILTERS_QUERY = "(min-width: 768px)";

const labelClass = "flex items-center gap-1.5 text-[12px] font-medium text-muted";

export function TransactionFiltersBar({ filters, categories, onChange, onReset, autoFocusSearch }: Props) {
  const { t, fmt } = useI18n();
  const l = t.transactions.filters;
  const typeOptions = [{ value: "all" as const, label: t.common.all }, ...transactionTypeOptions(t)];
  const [q, setQ] = useState(filters.q ?? "");
  const [min, setMin] = useState(filters.min ? formatCurrencyInput(filters.min) : "");
  const [max, setMax] = useState(filters.max ? formatCurrencyInput(filters.max) : "");
  const [expanded, setExpanded] = useState(!!(filters.from || filters.to || filters.min || filters.max || filters.category_id));
  const [sheetOpen, setSheetOpen] = useState(false);
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

  const resetAll = () => {
    setQ("");
    setMin("");
    setMax("");
    onReset();
  };

  const toggleFilters = () => {
    if (window.matchMedia(INLINE_FILTERS_QUERY).matches) setExpanded((v) => !v);
    else setSheetOpen(true);
  };

  // Các bộ lọc đang áp dụng dạng "chip" có nút bỏ riêng từng cái.
  const category = categories.find((c) => c.id === filters.category_id);
  const chips = [
    category && { key: "category", label: fmt.category(category.name), clear: () => onChange({ category_id: null }) },
    filters.from && { key: "from", label: l.chipFrom(formatDate(filters.from)), clear: () => onChange({ from: undefined }) },
    filters.to && { key: "to", label: l.chipTo(formatDate(filters.to)), clear: () => onChange({ to: undefined }) },
    filters.min && {
      key: "min",
      label: l.chipMin(formatVND(filters.min)),
      clear: () => {
        setMin("");
        onChange({ min: null });
      },
    },
    filters.max && {
      key: "max",
      label: l.chipMax(formatVND(filters.max)),
      clear: () => {
        setMax("");
        onChange({ max: null });
      },
    },
  ].filter((c): c is { key: string; label: string; clear: () => void } => !!c);

  const fields = (layout: "inline" | "sheet") => (
    <div
      className={cn(
        "grid gap-4",
        layout === "inline" && "sm:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))_repeat(2,minmax(0,1fr))] lg:gap-3"
      )}
    >
      <label className="space-y-1.5">
        <span className={labelClass}>
          <Tag className="size-3.5" aria-hidden /> {l.category}
        </span>
        <Select value={filters.category_id ?? ""} onChange={(e) => onChange({ category_id: e.target.value ? Number(e.target.value) : null })}>
          <option value="">{l.allCategories}</option>
          {visibleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {fmt.category(c.name)}
            </option>
          ))}
        </Select>
      </label>

      {/* Sheet: nhóm "khoảng ngày" và "khoảng số tiền" thành 2 cột; inline: mỗi trường một cột. */}
      <fieldset className={cn("min-w-0", layout === "inline" && "contents")}>
        {layout === "sheet" && (
          <legend className={cn(labelClass, "mb-1.5")}>
            <CalendarRange className="size-3.5" aria-hidden /> {l.dateRange}
          </legend>
        )}
        <div className={cn(layout === "sheet" ? "grid grid-cols-2 gap-3" : "contents")}>
          <label className="min-w-0 space-y-1.5">
            <span className={cn(layout === "sheet" ? "text-[12px] text-subtle" : labelClass)}>{l.from}</span>
            <Input type="date" value={filters.from ?? ""} onChange={(e) => onChange({ from: e.target.value || undefined })} />
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className={cn(layout === "sheet" ? "text-[12px] text-subtle" : labelClass)}>{l.to}</span>
            <Input type="date" value={filters.to ?? ""} min={filters.from} onChange={(e) => onChange({ to: e.target.value || undefined })} />
          </label>
        </div>
      </fieldset>

      <fieldset className={cn("min-w-0", layout === "inline" && "contents")}>
        {layout === "sheet" && (
          <legend className={cn(labelClass, "mb-1.5")}>
            <Coins className="size-3.5" aria-hidden /> {l.amountRange}
          </legend>
        )}
        <div className={cn(layout === "sheet" ? "grid grid-cols-2 gap-3" : "contents")}>
          <label className="min-w-0 space-y-1.5">
            <span className={cn(layout === "sheet" ? "text-[12px] text-subtle" : labelClass)}>{l.min}</span>
            <MoneyInput value={min} onValueChange={setMin} placeholder="0" />
          </label>
          <label className="min-w-0 space-y-1.5">
            <span className={cn(layout === "sheet" ? "text-[12px] text-subtle" : labelClass)}>{l.max}</span>
            <MoneyInput value={max} onValueChange={setMax} placeholder={l.noLimit} />
          </label>
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
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
          {/* Điện thoại: chiếm hết phần còn lại của hàng; từ 640px về kích thước tự nhiên. */}
          <Segmented
            label={l.type}
            value={filters.type ?? "all"}
            onChange={(type) => onChange({ type, category_id: null })}
            options={typeOptions}
            size="md"
            fullWidth
            className="min-w-0 flex-1 sm:inline-flex sm:w-auto sm:flex-none"
          />
          <Button
            variant={expanded || activeCount > 0 ? "secondary" : "outline"}
            onClick={toggleFilters}
            aria-expanded={expanded || sheetOpen}
            aria-controls="tx-advanced-filters"
            className="h-11 shrink-0 sm:h-9"
          >
            <SlidersHorizontal /> {l.button}
            {activeCount > 0 && (
              <span className="tabular flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-5 font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Chip bộ lọc: luôn hiện trên điện thoại; từ tablet chỉ hiện khi panel đang đóng. */}
      {chips.length > 0 && (
        <div className={cn("flex flex-wrap items-center gap-2", expanded && "md:hidden")} aria-label={l.activeLabel} role="group">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex h-8 max-w-full items-center gap-1 rounded-full border border-border bg-surface pr-1 pl-3 text-[13px] text-foreground"
            >
              <span className="truncate">{chip.label}</span>
              <button
                type="button"
                onClick={chip.clear}
                aria-label={l.removeChip(chip.label)}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </span>
          ))}
          <button type="button" onClick={resetAll} className="h-8 px-1 text-[13px] font-medium text-primary-ink hover:underline">
            {t.transactions.clearFilters}
          </button>
        </div>
      )}

      {/* Tablet trở lên: panel ngay trong trang. */}
      <div id="tx-advanced-filters" className={cn("rounded-lg border border-border bg-surface p-4 shadow-card max-md:hidden", !expanded && "hidden")}>
        {fields("inline")}
        {activeCount > 0 && (
          <div className="mt-3 flex justify-end border-t border-border pt-3">
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <X /> {t.transactions.clearFilters}
            </Button>
          </div>
        )}
      </div>

      {/* Điện thoại: bottom sheet – kết quả cập nhật ngay phía sau, nút dưới chỉ để đóng. */}
      <Dialog
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary-ink" aria-hidden /> {l.button}
          </span>
        }
        footer={
          <>
            <Button variant="outline" size="lg" onClick={resetAll} disabled={activeCount === 0} className="sm:h-9 sm:px-3.5 sm:text-sm">
              <X /> {t.transactions.clearFilters}
            </Button>
            <Button size="lg" onClick={() => setSheetOpen(false)} data-autofocus className="sm:h-9 sm:px-3.5 sm:text-sm">
              {l.showResults}
            </Button>
          </>
        }
      >
        {fields("sheet")}
      </Dialog>
    </div>
  );
}
