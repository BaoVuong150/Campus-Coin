"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  size?: "sm" | "md";
  className?: string;
  fullWidth?: boolean;
}

/** Nhóm nút chọn một (radiogroup) – điều hướng bằng phím mũi tên. */
export function Segmented<T extends string>({ value, onChange, options, label, size = "sm", className, fullWidth }: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex rounded-md border border-border bg-surface-secondary p-0.5", fullWidth && "flex w-full", className)}
    >
      {options.map((option, i) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "rounded-[5px] font-medium whitespace-nowrap transition-colors duration-150",
              // md: cao 40px trên điện thoại (dễ chạm), 32px từ 640px.
              size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-10 px-3 text-[13px] sm:h-8",
              fullWidth && "flex-1",
              active ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
