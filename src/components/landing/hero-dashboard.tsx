import { TrendingUp } from "lucide-react";
import type { CSSProperties } from "react";
import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { formatVND } from "@/lib/utils/money";
import { BalanceCard } from "./dashboard/balance-card";
import { BudgetOverview } from "./dashboard/budget-overview";
import { CashFlowMiniChart } from "./dashboard/cash-flow-mini-chart";
import { DemoSidebar } from "./dashboard/demo-sidebar";
import { RecentTransactions } from "./dashboard/recent-transactions";
import { SafeToSpendCard } from "./dashboard/safe-to-spend-card";
import { currentMonthNumber } from "./demo-helpers";

/** Mockup sản phẩm ở hero: dựng bằng component thật với dữ liệu mẫu, gắn nhãn rõ ràng. */
export function HeroDashboard({ t, locale }: { t: Messages; locale: Locale }) {
  const d = t.landing.demo;
  return (
    <figure className="relative animate-rise" style={{ "--rise": "20px", animationDelay: "240ms" } as CSSProperties}>
      <div className="absolute -inset-10 -z-10 rounded-full bg-brand-bright/10 blur-3xl" aria-hidden />

      <div className="flex overflow-hidden rounded-2xl border border-border bg-surface shadow-mockup lg:-rotate-[0.6deg]">
        <DemoSidebar t={t} />
        <div className="min-w-0 flex-1 space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-semibold tracking-tight text-foreground">{d.greeting(DEMO_FINANCE.userName)}</p>
              <p className="text-[12px] text-subtle">{d.monthCaption(currentMonthNumber())}</p>
            </div>
            <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] text-muted">{d.label}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-3">
              <BalanceCard t={t} />
            </div>
            <div className="sm:col-span-2">
              <SafeToSpendCard t={t} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="hidden sm:block">
              <CashFlowMiniChart t={t} locale={locale} />
            </div>
            <BudgetOverview t={t} />
          </div>

          <RecentTransactions t={t} />
        </div>
      </div>

      <div
        className="absolute top-44 -left-10 hidden animate-float items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-pop xl:flex"
        aria-hidden
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
          <TrendingUp className="size-4" strokeWidth={1.75} />
        </span>
        <span>
          <span className="tabular block text-sm font-semibold text-foreground">+{formatVND(DEMO_FINANCE.transactions[2].amount)}</span>
          <span className="block text-[11px] text-subtle">{d.floatingIncome}</span>
        </span>
      </div>
    </figure>
  );
}
