"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { formatCurrencyInput } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { controlClasses } from "./field";

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: string;
  onValueChange: (formatted: string) => void;
  size?: "md" | "xl";
}

/** Ô nhập tiền VND: tự thêm dấu chấm ngăn cách, bàn phím số trên mobile. */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onValueChange, size = "md", className, ...props },
  ref
) {
  const xl = size === "xl";
  return (
    <div className="relative">
      <input
        ref={ref}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onValueChange(formatCurrencyInput(e.target.value))}
        className={cn(
          controlClasses,
          "tabular pr-9",
          xl ? "h-14 text-[28px] font-semibold tracking-tight" : "h-9",
          className
        )}
        {...props}
      />
      <span
        className={cn("pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-subtle", xl ? "text-lg" : "text-sm")}
        aria-hidden
      >
        ₫
      </span>
    </div>
  );
});
