import { Gauge, PieChart, Zap } from "lucide-react";
import type { Messages } from "@/i18n";
import { SectionHeading } from "./section-heading";

const ICONS = [Zap, PieChart, Gauge];

export function ProblemSection({ t }: { t: Messages }) {
  const p = t.landing.problem;
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-20 bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading id="how-title" eyebrow={p.eyebrow} title={p.titleLines} align="center" />
        <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-10">
          {p.items.map((item, i) => {
            const Icon = ICONS[i];
            return (
              <li key={item.title}>
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-primary" strokeWidth={1.75} aria-hidden />
                  <span className="tabular font-mono text-[13px] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.65] text-muted">{item.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
