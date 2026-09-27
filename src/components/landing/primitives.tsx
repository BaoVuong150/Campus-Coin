import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { Bike, Coffee, Wallet } from "lucide-react";
import type { DemoIcon } from "@/data/demo-finance";
import { formatVND } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

/** Nền card chuẩn của landing: nền surface, viền rất nhẹ, bóng tối giản. */
export function SurfaceCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-border bg-surface shadow-card", className)} {...props} />;
}

/** Ngưỡng cảnh báo ngân sách, khớp với ứng dụng (80%). */
const WARNING_PERCENT = 80;

export function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  const tone = percent > 100 ? "bg-danger" : percent >= WARNING_PERCENT ? "bg-warning" : "bg-brand";
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={cn("h-1.5 overflow-hidden rounded-full bg-surface-secondary", className)}
    >
      <div
        className={cn("h-full origin-left animate-grow-x rounded-full", tone)}
        style={{ width: `${Math.min(100, percent)}%`, animationDelay: "var(--delay, 300ms)" }}
      />
    </div>
  );
}

export function BudgetRow({ label, spent, limit, compact }: { label: string; spent: number; limit: number; compact?: boolean }) {
  const percent = Math.round((spent / limit) * 100);
  const percentClass = cn("font-medium", percent >= WARNING_PERCENT ? "text-warning" : "text-foreground");

  // Bản gọn cho mockup hẹp: nhãn + % ở trên, số tiền nhỏ ở dưới để không gãy dòng.
  if (compact) {
    return (
      <div className="space-y-1.5 text-[12px]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-medium text-foreground">{label}</span>
          <span className={cn("tabular", percentClass)}>{percent}%</span>
        </div>
        <ProgressBar percent={percent} label={label} />
        <p className="tabular truncate text-[11px] text-subtle">
          {formatVND(spent)} / {formatVND(limit)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular text-muted">
          {formatVND(spent)} <span className="text-subtle">/ {formatVND(limit)}</span>
          <span className={cn("ml-2", percentClass)}>{percent}%</span>
        </span>
      </div>
      <ProgressBar percent={percent} label={label} />
    </div>
  );
}

const ICONS: Record<DemoIcon, typeof Coffee> = { coffee: Coffee, bike: Bike, wallet: Wallet };

interface TransactionRowProps {
  icon: DemoIcon;
  name: string;
  meta: string;
  amount: number;
  type: "income" | "expense";
  typeLabel: string;
}

/** Dòng giao dịch: dấu +/− và nhãn ẩn để màu không phải là tín hiệu duy nhất. */
export function TransactionRow({ icon, name, meta, amount, type, typeLabel }: TransactionRowProps) {
  const Icon = ICONS[icon];
  const income = type === "income";
  return (
    <li className="-mx-2 flex h-13 items-center gap-3 rounded-lg px-2 transition-colors duration-150 hover:bg-surface-secondary">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          income ? "bg-primary-soft text-primary-ink" : "bg-surface-secondary text-muted"
        )}
        aria-hidden
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
        <span className="block truncate text-[12px] text-subtle">{meta}</span>
      </span>
      <span className={cn("tabular text-[13px] font-medium whitespace-nowrap", income ? "text-success" : "text-foreground")}>
        <span className="sr-only">{typeLabel}: </span>
        {income ? "+" : "−"}
        {formatVND(amount)}
      </span>
    </li>
  );
}

/** Đường xu hướng nhỏ, vẽ bằng SVG thuần. */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const width = 120;
  const height = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lastX, lastY] = points[points.length - 1].split(",");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-10 w-30", className)} aria-hidden>
      <polyline points={points.join(" ")} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}

export interface BarDatum {
  key: string;
  label: string;
  income: number;
  expense: number;
}

interface BarChartProps {
  data: BarDatum[];
  height: number;
  incomeLabel: string;
  expenseLabel: string;
  showLabels?: boolean;
  formatValue: (value: number) => string;
}

/**
 * Biểu đồ cột Thu/Chi dựng bằng HTML (nhẹ hơn thư viện chart cho landing).
 * Tooltip hiện khi hover; dữ liệu đầy đủ nằm trong bảng ẩn cho trình đọc màn hình ở component cha.
 */
export function BarChart({ data, height, incomeLabel, expenseLabel, showLabels = true, formatValue }: BarChartProps) {
  const max = Math.max(...data.flatMap((d) => [d.income, d.expense]));
  const barStyle = (value: number, color: string, index: number): CSSProperties => ({
    height: `${(value / max) * 100}%`,
    backgroundColor: color,
    animationDelay: `${200 + index * 40}ms`,
  });
  return (
    <div aria-hidden>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end justify-center gap-0.75">
            <span className="w-full max-w-4 origin-bottom animate-grow-y rounded-t-[4px]" style={barStyle(d.income, "var(--chart-income)", i)} />
            <span className="w-full max-w-4 origin-bottom animate-grow-y rounded-t-[4px]" style={barStyle(d.expense, "var(--chart-expense)", i)} />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] whitespace-nowrap opacity-0 shadow-pop transition-opacity duration-150 group-hover:opacity-100">
              <span className="block font-medium text-foreground">{d.label}</span>
              <span className="tabular block text-muted">
                {incomeLabel} {formatValue(d.income)}
              </span>
              <span className="tabular block text-muted">
                {expenseLabel} {formatValue(d.expense)}
              </span>
            </span>
          </div>
        ))}
      </div>
      {showLabels && (
        <div className="mt-2 flex gap-1.5 sm:gap-2.5">
          {data.map((d) => (
            <span key={d.key} className="flex-1 text-center text-[11px] text-subtle">
              {d.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function LegendItem({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
      <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {children}
    </span>
  );
}
