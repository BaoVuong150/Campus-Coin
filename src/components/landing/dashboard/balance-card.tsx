import { ArrowUpRight } from "lucide-react";
import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { formatPercent, formatVND } from "@/lib/utils/money";
import { Sparkline } from "../primitives";

export function BalanceCard({ t }: { t: Messages }) {
  const d = t.landing.demo;
  return (
    <div className="relative rounded-xl bg-surface-secondary p-4 sm:p-5">
      <Sparkline values={DEMO_FINANCE.balanceTrend} className="absolute top-4 right-4 hidden w-22 sm:block" />
      <div>
        <p className="text-[12px] text-muted">{d.balance}</p>
        <p className="tabular mt-1 text-[28px] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-foreground">{formatVND(DEMO_FINANCE.balance)}</p>
        <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-success">
          <ArrowUpRight className="size-3.5" aria-hidden />
          {d.balanceChange(formatPercent(DEMO_FINANCE.balanceChangePercent))}
        </p>
      </div>
    </div>
  );
}
