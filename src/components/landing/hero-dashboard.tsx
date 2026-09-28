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

/**
 * Mockup sản phẩm ở hero (tablet trở lên): dựng bằng component thật với dữ liệu mẫu, gắn nhãn rõ ràng.
 * Bố cục bên trong dùng container query (@container) nên tự co theo chiều rộng cột, không theo viewport:
 * ≥ 512px hai cột + biểu đồ; ≥ 672px hiện thêm thanh bên. Không dùng transform: scale().
 */
export function HeroDashboard({ t, locale }: { t: Messages; locale: Locale }) {
  const d = t.landing.demo;
  return (
    <figure className="@container relative animate-rise" style={{ "--rise": "20px", animationDelay: "240ms" } as CSSProperties}>
      <div className="pointer-events-none absolute inset-x-6 -inset-y-6 -z-10 hidden rounded-full bg-brand-bright/8 blur-3xl lg:block" aria-hidden />

      <div className="flex overflow-hidden rounded-[22px] border border-border bg-surface shadow-mockup">
        <DemoSidebar t={t} />
        <div className="min-w-0 flex-1 space-y-3 p-4 @xl:p-5 @3xl:space-y-4 @3xl:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight text-foreground">{d.greeting(DEMO_FINANCE.userName)}</p>
              <p className="text-[12px] text-subtle">{d.monthCaption(currentMonthNumber())}</p>
            </div>
            <span className="shrink-0 rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] text-muted">{d.label}</span>
          </div>

          <div className="grid gap-3 @lg:grid-cols-5 @3xl:gap-4">
            <div className="@lg:col-span-3">
              <BalanceCard t={t} />
            </div>
            <div className="@lg:col-span-2">
              <SafeToSpendCard t={t} />
            </div>
          </div>

          <div className="grid gap-3 @lg:grid-cols-2 @3xl:gap-4">
            <div className="hidden @lg:block">
              <CashFlowMiniChart t={t} locale={locale} />
            </div>
            <BudgetOverview t={t} />
          </div>

          <RecentTransactions t={t} />
        </div>
      </div>

      {/* Thẻ nổi: chỉ hiện khi cột trái có khoảng trống để "gác" vào (≥ 1280); tablet/mobile ẩn để không tràn ngang. */}
      <div
        className="pointer-events-none absolute top-[38%] -left-[18px] hidden animate-float items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-pop xl:flex 3xl:-left-11"
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
