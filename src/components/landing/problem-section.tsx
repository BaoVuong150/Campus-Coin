import { Gauge, PieChart, Zap } from "lucide-react";
import { Section } from "@/components/layout/container";
import type { Messages } from "@/i18n";
import { SectionHeading } from "./section-heading";

const ICONS = [Zap, PieChart, Gauge];

export function ProblemSection({ t }: { t: Messages }) {
  const p = t.landing.problem;
  return (
    <Section id="how" labelledBy="how-title" className="bg-surface">
      <SectionHeading id="how-title" eyebrow={p.eyebrow} title={p.titleLines} align="center" />
      <ol className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-10 xl:gap-16">
        {p.items.map((item, i) => {
          const Icon = ICONS[i];
          return (
            <li key={item.title}>
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-primary-ink" strokeWidth={1.75} aria-hidden />
                <span className="tabular font-mono text-[13px] text-subtle">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-[1.65] text-muted">{item.body}</p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
