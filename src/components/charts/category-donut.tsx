"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChartColors } from "@/hooks/use-chart-colors";
import { formatPercent, formatVND } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { useI18n } from "@/i18n/provider";
import type { CategoryBreakdownItem } from "@/types/finance";

export interface DonutSlice extends CategoryBreakdownItem {
  color: string;
}

/** Tối đa 5 danh mục lớn nhất + "Khác" để donut không vụn. */
export const MAX_SLICES = 5;
/** Nhóm gộp các danh mục nhỏ; tên hiển thị lấy từ từ điển (t.common.other). */
const OTHER_ID = -1;

/**
 * Màu gắn với danh mục (theo id), không theo thứ hạng: lọc tháng khác cũng không đổi màu của danh mục.
 * Danh mục hệ thống nhận 8 màu categorical cố định; phần còn lại dùng màu "Khác".
 */
export function colorForCategory(categoryId: number, orderedIds: number[], series: string[], other: string): string {
  const index = orderedIds.indexOf(categoryId);
  return index >= 0 && index < series.length ? series[index] : other;
}

export function buildSlices(items: CategoryBreakdownItem[], orderedIds: number[], series: string[], other: string): DonutSlice[] {
  const top = items.slice(0, MAX_SLICES).map((i) => ({ ...i, color: colorForCategory(i.categoryId, orderedIds, series, other) }));
  const rest = items.slice(MAX_SLICES);
  if (rest.length === 0) return top;
  const amount = rest.reduce((a, b) => a + b.amount, 0);
  const percentage = rest.reduce((a, b) => a + b.percentage, 0);
  return [...top, { categoryId: OTHER_ID, name: "", icon: null, color: other, amount, percentage }];
}

interface Props {
  slices: DonutSlice[];
  total: number;
  onSelect?: (slice: DonutSlice) => void;
}

export function CategoryDonut({ slices, total, onSelect }: Props) {
  const colors = useChartColors();
  const { t, fmt } = useI18n();
  const label = (s: DonutSlice) => (s.categoryId === OTHER_ID ? t.common.other : fmt.category(s.name));
  return (
    // Bố cục theo chiều rộng thẻ (container query), không theo viewport: thẻ hẹp trong lưới 12 cột vẫn xếp dọc.
    <div className="@container">
      <div className="flex flex-col items-center gap-5 @md:flex-row @md:items-center">
        <div className="relative size-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={slices.length > 1 ? 1.5 : 0}
                stroke={colors.surface}
                strokeWidth={2}
                isAnimationActive={false}
                onClick={(_, index) => onSelect?.(slices[index])}
              >
                {slices.map((s) => (
                  <Cell key={s.categoryId} fill={s.color} className={onSelect && s.categoryId > 0 ? "cursor-pointer" : undefined} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.[0] ? (
                    <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] shadow-pop">
                      <p className="font-medium text-foreground">{label(payload[0].payload as DonutSlice)}</p>
                      <p className="tabular text-muted">
                        {formatVND(Number(payload[0].value))} · {formatPercent((payload[0].payload as DonutSlice).percentage)}
                      </p>
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-subtle">{t.dashboard.categories.total}</span>
            <span className="tabular text-sm font-semibold text-foreground">{formatVND(total)}</span>
          </div>
        </div>

        <ul className="w-full min-w-0 space-y-1">
          {slices.map((s) => {
            const clickable = !!onSelect && s.categoryId > 0;
            const content = (
              <>
                <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-left text-foreground">{label(s)}</span>
                <span className="tabular text-muted">{formatPercent(s.percentage, 0)}</span>
              </>
            );
            return (
              <li key={s.categoryId}>
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onSelect?.(s)}
                    className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-surface-hover")}
                    aria-label={t.dashboard.categories.sliceLabel(label(s), formatVND(s.amount), formatPercent(s.percentage, 0))}
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 px-2 py-1.5 text-[13px]">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
