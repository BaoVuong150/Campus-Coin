import type { Messages } from "@/i18n";
import { compact } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import { demoCashFlow } from "../demo-helpers";
import { BarChart, LegendItem } from "../primitives";

const MONTHS = 6;

export function CashFlowMiniChart({ t, locale }: { t: Messages; locale: Locale }) {
  const d = t.landing.demo;
  return (
    <div className="rounded-xl bg-surface-secondary p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted">{d.cashflow}</p>
        <div className="flex gap-3">
          <LegendItem color="var(--chart-income)">{d.income}</LegendItem>
          <LegendItem color="var(--chart-expense)">{d.expense}</LegendItem>
        </div>
      </div>
      <BarChart
        data={demoCashFlow(t, MONTHS)}
        height={84}
        incomeLabel={d.income}
        expenseLabel={d.expense}
        formatValue={(v) => compact(t, locale, v)}
      />
    </div>
  );
}
