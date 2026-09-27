import { AlertTriangle, Bus, Coffee, Wallet } from "lucide-react";
import type { Messages } from "@/i18n";

/** Dữ liệu minh họa cố định cho bản xem trước (không phải dữ liệu người dùng). */
const CASH_FLOW = [
  { income: 62, expense: 48 },
  { income: 70, expense: 55 },
  { income: 60, expense: 58 },
  { income: 74, expense: 61 },
  { income: 68, expense: 52 },
  { income: 80, expense: 57 },
];
const ITEM_ICONS = [Coffee, Bus, Wallet];
const ITEM_AMOUNTS = ["− 45.000 ₫", "− 32.000 ₫", "+ 3.000.000 ₫"];

function Bar({ value, color }: { value: number; color: string }) {
  return <span className="w-2.5 rounded-t-[3px] sm:w-3" style={{ height: `${value}%`, backgroundColor: color }} />;
}

/** Bản xem trước giao diện Tổng quan, dựng bằng HTML/CSS và token thật của hệ thống. */
export function HeroPreview({ t }: { t: Messages }) {
  const p = t.landing.preview;
  return (
    <figure className="relative" aria-label={p.label}>
      <div className="rounded-xl border border-border bg-surface p-4 shadow-pop sm:p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{p.greeting}</p>
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-subtle">{p.label}</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-border p-4 sm:col-span-3">
            <p className="text-[12px] text-muted">{p.safe}</p>
            <p className="tabular mt-1 text-[28px] leading-none font-semibold tracking-tight text-foreground">
              126.000 ₫<span className="text-sm font-medium text-muted"> {p.perDay}</span>
            </p>
            <p className="mt-2 text-[12px] text-subtle">{p.daysLeft}</p>
          </div>
          <div className="rounded-lg border border-border p-4 sm:col-span-2">
            <p className="text-[12px] text-muted">{p.cashflow}</p>
            <div className="mt-3 flex h-16 items-end justify-between gap-1" aria-hidden>
              {CASH_FLOW.map((m, i) => (
                <span key={i} className="flex h-full items-end gap-0.5">
                  <Bar value={m.income} color="var(--chart-income)" />
                  <Bar value={m.expense} color="var(--chart-expense)" />
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-subtle">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm" style={{ backgroundColor: "var(--chart-income)" }} /> {p.income}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm" style={{ backgroundColor: "var(--chart-expense)" }} /> {p.expense}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-[12px] text-muted">{p.budget}</p>
            <div className="mt-3 space-y-3 text-[12px]">
              <div>
                <div className="flex justify-between text-foreground">
                  <span>{p.food}</span>
                  <span className="tabular text-muted">1.640.000 / 2.000.000</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-secondary">
                  <div className="h-full w-[82%] rounded-full bg-warning" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-foreground">
                  <span>{p.transport}</span>
                  <span className="tabular text-muted">360.000 / 800.000</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-surface-secondary">
                  <div className="h-full w-[45%] rounded-full bg-primary" />
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-warning">
                <AlertTriangle className="size-3.5" aria-hidden /> {p.warning}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-[12px] text-muted">{p.recent}</p>
            <ul className="mt-2 divide-y divide-border">
              {p.items.map(([name, meta], i) => {
                const Icon = ITEM_ICONS[i];
                const income = ITEM_AMOUNTS[i].startsWith("+");
                return (
                  <li key={name} className="flex items-center gap-2.5 py-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium text-foreground">{name}</span>
                      <span className="block truncate text-[11px] text-subtle">{meta}</span>
                    </span>
                    <span className={`tabular text-[12px] font-medium whitespace-nowrap ${income ? "text-success" : "text-danger"}`}>
                      {ITEM_AMOUNTS[i]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </figure>
  );
}
