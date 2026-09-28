import { LayoutDashboard, MoreHorizontal, Plus, Receipt, Wallet } from "lucide-react";
import type { CSSProperties } from "react";
import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { cn } from "@/lib/utils/cn";
import { BalanceCard } from "./dashboard/balance-card";
import { BudgetOverview } from "./dashboard/budget-overview";
import { RecentTransactions } from "./dashboard/recent-transactions";
import { SafeToSpendCard } from "./dashboard/safe-to-spend-card";
import { currentMonthNumber } from "./demo-helpers";

/**
 * Mockup hero cho điện thoại (< 768px): một màn hình app Campus Coin thật sự – một cột,
 * số dư → có thể chi hôm nay → ngân sách → giao dịch gần đây → thanh điều hướng dưới.
 * Không thu nhỏ mockup desktop, không có nhãn biểu đồ li ti.
 */
export function HeroMobileDashboard({ t }: { t: Messages }) {
  const d = t.landing.demo;
  // Giống hệt thanh điều hướng dưới của app thật: Tổng quan · Giao dịch · + · Ngân sách · Thêm.
  const nav = [
    { Icon: LayoutDashboard, label: d.sidebar[0] },
    { Icon: Receipt, label: d.sidebar[1] },
    { Icon: Wallet, label: d.sidebar[2] },
    { Icon: MoreHorizontal, label: t.nav.more },
  ];
  return (
    <figure
      className="relative mx-auto w-full max-w-[420px] animate-rise"
      style={{ "--rise": "16px", animationDelay: "240ms" } as CSSProperties}
    >
      <div className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-mockup">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{d.greeting(DEMO_FINANCE.userName)}</p>
            <p className="text-[12px] text-subtle">{d.monthCaption(currentMonthNumber())}</p>
          </div>
          <span className="shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] text-muted">{d.label}</span>
        </div>

        <div className="space-y-3 px-4 pb-4">
          <BalanceCard t={t} />
          <SafeToSpendCard t={t} />
          <BudgetOverview t={t} />
          <RecentTransactions t={t} />
        </div>

        {/* Thanh điều hướng dưới của app, nút + ở giữa như app thật. */}
        <div className="flex items-center border-t border-border bg-surface px-2 pt-2 pb-3" aria-hidden>
          {nav.slice(0, 2).map(({ Icon, label }, i) => (
            <NavIcon key={label} label={label} active={i === 0}>
              <Icon className="size-5" strokeWidth={1.75} />
            </NavIcon>
          ))}
          <div className="flex flex-1 justify-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop">
              <Plus className="size-5" />
            </span>
          </div>
          {nav.slice(2).map(({ Icon, label }) => (
            <NavIcon key={label} label={label}>
              <Icon className="size-5" strokeWidth={1.75} />
            </NavIcon>
          ))}
        </div>
      </div>
    </figure>
  );
}

function NavIcon({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn("flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[11px]", active ? "text-primary-ink" : "text-subtle")}>
      {children}
      <span className="max-w-full truncate">{label}</span>
    </span>
  );
}
