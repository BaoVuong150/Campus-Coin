"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentMonthKey, monthLabel, shiftMonthKey } from "@/lib/utils/date";

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
  /** Không cho chọn tháng tương lai quá xa. */
  maxAhead?: number;
}

export function MonthPicker({ value, onChange, maxAhead = 1 }: MonthPickerProps) {
  const max = shiftMonthKey(currentMonthKey(), maxAhead);
  const isCurrent = value === currentMonthKey();
  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-0.5">
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(shiftMonthKey(value, -1))} aria-label="Tháng trước">
        <ChevronLeft />
      </Button>
      <span className="min-w-28 text-center text-sm font-medium text-foreground" aria-live="polite">
        {monthLabel(value)}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => onChange(shiftMonthKey(value, 1))} disabled={value >= max} aria-label="Tháng sau">
        <ChevronRight />
      </Button>
      {!isCurrent && (
        <Button variant="ghost" size="sm" onClick={() => onChange(currentMonthKey())}>
          Hôm nay
        </Button>
      )}
    </div>
  );
}
