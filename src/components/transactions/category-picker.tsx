"use client";

import { useRef, type KeyboardEvent } from "react";
import { CategoryIcon } from "@/components/common/category-icon";
import { cn } from "@/lib/utils/cn";
import type { CategoryDTO } from "@/types/finance";
import { useI18n } from "@/i18n/provider";

interface CategoryPickerProps {
  categories: CategoryDTO[];
  value: number | null;
  onChange: (id: number) => void;
  labelledBy: string;
  invalid?: boolean;
}

/** Lưới chọn danh mục (icon + tên), dạng radiogroup hỗ trợ phím mũi tên. */
export function CategoryPicker({ categories, value, onChange, labelledBy, invalid }: CategoryPickerProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { fmt } = useI18n();
  const activeIndex = Math.max(0, categories.findIndex((c) => c.id === value));

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + categories.length) % categories.length;
    onChange(categories[next].id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid || undefined}
      className="grid grid-cols-3 gap-1.5 sm:grid-cols-4"
    >
      {categories.map((c, i) => {
        const selected = c.id === value;
        return (
          <button
            key={c.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onChange(c.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "flex min-h-17 flex-col items-center justify-center gap-1.5 rounded-md border px-1.5 py-2 text-center text-[12px] leading-tight transition-colors duration-150",
              selected
                ? "border-primary bg-primary-soft text-foreground"
                : "border-border text-muted hover:border-border-strong hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
            <span className="line-clamp-2">{fmt.category(c.name)}</span>
          </button>
        );
      })}
    </div>
  );
}
