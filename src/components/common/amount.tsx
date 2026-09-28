import { formatVND } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import type { TransactionType } from "@/types/finance";

interface AmountProps {
  value: number;
  type?: TransactionType;
  className?: string;
}

/** Số tiền có dấu: thu "+ 2.000.000 ₫" (xanh), chi "− 89.000 ₫" (đỏ). */
export function Amount({ value, type, className }: AmountProps) {
  const sign = type === "income" ? "+ " : type === "expense" ? "− " : "";
  return (
    <span
      className={cn(
        "tabular font-medium whitespace-nowrap",
        type === "income" ? "text-success" : type === "expense" ? "text-danger" : "",
        className
      )}
    >
      {sign}
      {formatVND(Math.abs(value))}
    </span>
  );
}
