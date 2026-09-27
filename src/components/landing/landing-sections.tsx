import Link from "next/link";
import { BellRing, CalendarClock, ChevronDown, FileDown, Gauge, Repeat, Target, type LucideIcon } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { Messages } from "@/i18n";

/** Icon theo thứ tự của t.landing.featureList. */
const FEATURE_ICONS: LucideIcon[] = [Gauge, CalendarClock, BellRing, Repeat, Target, FileDown];

function SectionHeading({ id, eyebrow, title, subtitle }: { id: string; eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
      <h2 id={id} className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </div>
  );
}

export function StepsSection({ t }: { t: Messages }) {
  const l = t.landing;
  return (
    <section aria-labelledby="steps-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading id="steps-title" title={l.stepsTitle} subtitle={l.stepsSubtitle} />
      <ol className="mt-10 grid gap-8 md:grid-cols-3">
        {l.steps.map((step, i) => (
          <li key={step.title} className="border-t border-border pt-5">
            <span className="tabular font-mono text-sm text-primary">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 text-[15px] font-semibold text-foreground">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FeaturesSection({ t }: { t: Messages }) {
  const l = t.landing;
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHeading id="features-title" eyebrow={l.features} title={l.featuresTitle} subtitle={l.featuresSubtitle} />
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {l.featureList.map(({ title, description }, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={title} className="bg-surface p-6 transition-colors duration-150 hover:bg-surface-secondary">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function TransparencySection({ t }: { t: Messages }) {
  const l = t.landing;
  const [resultLabel, resultValue] = l.formulaResult;
  return (
    <section aria-labelledby="transparency-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <SectionHeading id="transparency-title" eyebrow={l.transparencyEyebrow} title={l.transparencyTitle} subtitle={l.transparencyBody} />
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <dl className="space-y-3 text-sm">
            {l.formula.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="text-muted">{label}</dt>
                <dd className="tabular text-foreground">{value}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-border-strong pt-3 font-semibold">
              <dt className="text-foreground">{resultLabel}</dt>
              <dd className="tabular text-foreground">{resultValue}</dd>
            </div>
          </dl>
          <p className="tabular mt-4 rounded-md bg-primary-soft px-3 py-2 text-sm font-medium text-primary">{l.formulaDaily}</p>
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ t }: { t: Messages }) {
  const l = t.landing;
  return (
    <section aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
      <h2 id="faq-title" className="text-2xl font-semibold tracking-tight text-foreground">
        {l.faqTitle}
      </h2>
      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
        {l.faq.map(({ q, a }) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex list-none items-center justify-between gap-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {q}
              <ChevronDown className="size-4 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden />
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaSection({ t, signedIn }: { t: Messages; signedIn: boolean }) {
  const l = t.landing;
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-border bg-primary-soft p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{l.ctaTitle}</h2>
          <p className="mt-1.5 text-muted">{l.ctaBody}</p>
        </div>
        <Link href={signedIn ? "/dashboard" : "/register"} className={buttonClasses("primary", "lg")}>
          {signedIn ? l.ctaApp : l.ctaStart}
        </Link>
      </div>
    </section>
  );
}
