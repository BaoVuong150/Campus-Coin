import { formatVND } from "@/lib/utils/money";

interface TooltipEntry {
  name?: string | number;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly TooltipEntry[];
  labels?: Record<string, string>;
}

/** Tooltip dùng chung: chữ theo token văn bản, màu series chỉ ở chấm đánh dấu. */
export function ChartTooltip({ active, label, payload, labels }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-40 rounded-md border border-border bg-surface px-3 py-2 text-[12px] shadow-pop">
      {label !== undefined && <p className="mb-1.5 font-medium text-foreground">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
              {labels?.[String(entry.dataKey)] ?? entry.name}
            </span>
            <span className="tabular font-medium text-foreground">{formatVND(Number(entry.value ?? 0))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}
