import { Check } from "lucide-react";
import { DEMO_BUDGET_REMAINING, DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { formatVND } from "@/lib/utils/money";
import { SurfaceCard } from "./primitives";
import { SectionHeading } from "./section-heading";

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className={strong ? "font-medium text-foreground" : "text-muted"}>{label}</dt>
      <dd className={`tabular ${strong ? "font-semibold text-foreground" : "text-foreground"}`}>{value}</dd>
    </div>
  );
}

export function SafeToSpendSection({ t }: { t: Messages }) {
  const s = t.landing.safe;
  const d = DEMO_FINANCE;
  const spendable = d.balance - d.fixedExpensesLeft - d.savingsTarget;
  const byBalance = Math.round(spendable / d.daysLeft);

  return (
    <section id="product" aria-labelledby="product-title" className="scroll-mt-20 bg-surface-secondary">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-28">
        <div>
          <SectionHeading id="product-title" eyebrow={s.eyebrow} title={s.title} body={s.body} />
          <p className="mt-8 text-[13px] font-medium tracking-wide text-subtle uppercase">{s.factorsTitle}</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {s.factors.map((factor) => (
              <li key={factor} className="flex items-center gap-2 text-[15px] text-foreground">
                <Check className="size-4 text-primary" strokeWidth={2} aria-hidden />
                {factor}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">{s.note}</p>
        </div>

        <SurfaceCard className="p-6 sm:p-8">
          <p className="text-sm font-medium text-primary">{s.cardTitle}</p>
          <p className="tabular mt-2 text-[44px] leading-none font-[650] tracking-[-0.04em] text-foreground sm:text-[52px]">
            {formatVND(d.safeToSpend)}
            <span className="text-lg font-medium tracking-normal text-muted"> {s.perDay}</span>
          </p>
          <dl className="mt-8 divide-y divide-border">
            <Line label={s.balance} value={formatVND(d.balance)} />
            <Line label={s.fixed} value={`− ${formatVND(d.fixedExpensesLeft)}`} />
            <Line label={s.savings} value={`− ${formatVND(d.savingsTarget)}`} />
            <Line label={s.byBalance(d.daysLeft)} value={`≈ ${formatVND(byBalance)}`} />
            <Line label={s.budgetLeft} value={formatVND(DEMO_BUDGET_REMAINING)} />
            <Line label={s.byBudget(d.daysLeft)} value={`= ${formatVND(d.safeToSpend)}`} strong />
          </dl>
          <p className="mt-4 rounded-lg bg-primary-soft px-3 py-2 text-[13px] font-medium text-primary">
            {s.result}: {formatVND(d.safeToSpend)} {s.perDay}
          </p>
        </SurfaceCard>
      </div>
    </section>
  );
}
