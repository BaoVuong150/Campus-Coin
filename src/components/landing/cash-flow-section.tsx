"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/layout/container";
import { Segmented } from "@/components/ui/segmented";
import { useI18n } from "@/i18n/provider";
import { formatVND } from "@/lib/utils/money";
import { demoCashFlow } from "./demo-helpers";
import { BarChart, LegendItem, SurfaceCard } from "./primitives";
import { SectionHeading } from "./section-heading";

type Range = "3" | "6" | "12";
const RANGES: Range[] = ["3", "6", "12"];

export function CashFlowSection() {
  const { t, fmt } = useI18n();
  const c = t.landing.cashflow;
  const [range, setRange] = useState<Range>("6");
  const data = useMemo(() => demoCashFlow(t, Number(range)), [t, range]);
  const income = data.reduce((a, m) => a + m.income, 0);
  const expense = data.reduce((a, m) => a + m.expense, 0);

  const stats = [
    { label: c.income, value: income, color: "var(--chart-income)" },
    { label: c.expense, value: expense, color: "var(--chart-expense)" },
    { label: c.savings, value: income - expense, color: "var(--brand)" },
  ];

  return (
    <Section labelledBy="cashflow-title" className="bg-surface-secondary">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading id="cashflow-title" eyebrow={c.eyebrow} title={c.title} body={c.body} />
        <Segmented
          label={c.range}
          value={range}
          onChange={setRange}
          options={RANGES.map((value) => ({ value, label: c.ranges[value] }))}
          size="md"
        />
      </div>

      <SurfaceCard className="mt-10 p-4 sm:p-8 lg:mt-12">
        <div className="mb-6 flex gap-4">
          <LegendItem color="var(--chart-income)">{c.income}</LegendItem>
          <LegendItem color="var(--chart-expense)">{c.expense}</LegendItem>
        </div>
        <BarChart data={data} height={260} incomeLabel={c.income} expenseLabel={c.expense} formatValue={fmt.compact} />
        <table className="sr-only">
          <caption>{c.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">—</th>
              <th scope="col">{c.income}</th>
              <th scope="col">{c.expense}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.label}</th>
                <td>{formatVND(m.income)}</td>
                <td>{formatVND(m.expense)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="flex items-center gap-2 text-[13px] text-muted">
                <span className="size-2 rounded-full" style={{ backgroundColor: stat.color }} aria-hidden />
                {stat.label}
              </dt>
              <dd className="tabular mt-1 text-2xl font-semibold tracking-[-0.03em] text-foreground">{formatVND(stat.value)}</dd>
            </div>
          ))}
        </dl>
      </SurfaceCard>
    </Section>
  );
}
