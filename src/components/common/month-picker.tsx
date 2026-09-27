"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentMonthKey, shiftMonthKey } from "@/lib/utils/date";
import { useI18n } from "@/i18n/provider";

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
  /** Không cho chọn tháng tương lai quá xa. */
  maxAhead?: number;
}

export function MonthPicker({ value, onChange, maxAhead = 1 }: MonthPickerProps) {
  const { t, fmt } = useI18n();
  const max = shiftMonthKey(currentMonthKey(), maxAhead);
  const isCurrent = value === currentMonthKey();
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(shiftMonthKey(value, -1))} aria-label={t.budgets.monthPicker.prev}>
        <ChevronLeft />
      </Button>
      <span className="min-w-28 text-center text-sm font-medium text-foreground" aria-live="polite">
        {fmt.month(value)}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(shiftMonthKey(value, 1))} disabled={value >= max} aria-label={t.budgets.monthPicker.next}>
        <ChevronRight />
      </Button>
      {!isCurrent && (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentMonthKey())}>
          {t.common.today}
        </Button>
      )}
    </div>
  );
}
