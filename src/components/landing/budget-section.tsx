import { AlertTriangle, Check } from "lucide-react";
import { Section } from "@/components/layout/container";
import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { formatVND } from "@/lib/utils/money";
import { BudgetRow, SurfaceCard } from "./primitives";
import { SectionHeading } from "./section-heading";

const SHOWN_CATEGORIES = 3;

export function BudgetSection({ t }: { t: Messages }) {
  const b = t.landing.budget;
  const d = t.landing.demo;
  const food = DEMO_FINANCE.budgets[0];

  return (
    <Section id="features" labelledBy="features-title" className="bg-surface" containerClassName="grid items-center gap-12 md:gap-14 lg:grid-cols-2 lg:gap-[clamp(48px,6vw,112px)]">
      <SurfaceCard className="order-2 p-6 sm:p-8 lg:order-1">
        <p className="text-sm font-medium text-foreground">{d.budget}</p>
        <div className="mt-6 space-y-6">
          {DEMO_FINANCE.budgets.slice(0, SHOWN_CATEGORIES).map((item) => (
            <BudgetRow key={item.category} label={d.categories[item.category]} spent={item.spent} limit={item.limit} />
          ))}
        </div>
        <p className="mt-7 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {b.warning(d.categories.food, formatVND(food.limit - food.spent), DEMO_FINANCE.daysLeft)}
        </p>
      </SurfaceCard>

      <div className="order-1 min-w-0 lg:order-2">
        <SectionHeading id="features-title" eyebrow={b.eyebrow} title={b.title} body={b.body} />
        <ul className="mt-8 space-y-3">
          {b.points.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-[15px] text-foreground">
              <Check className="size-4 text-primary-ink" strokeWidth={2} aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
