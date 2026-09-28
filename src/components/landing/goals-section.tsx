import { Laptop } from "lucide-react";
import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { formatVND } from "@/lib/utils/money";
import { SurfaceCard } from "./primitives";
import { SectionHeading } from "./section-heading";

const ARC_RADIUS = 52;
const ARC_LENGTH = 2 * Math.PI * ARC_RADIUS;

/** Vòng tiến độ SVG, tô từ 12 giờ theo chiều kim đồng hồ. */
function ProgressArc({ percent, label }: { percent: number; label: string }) {
  return (
    <div className="relative size-36 shrink-0" role="img" aria-label={`${label}: ${percent}%`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={ARC_RADIUS} fill="none" stroke="var(--surface-secondary)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={ARC_RADIUS}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * ARC_LENGTH} ${ARC_LENGTH}`}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-2xl font-semibold tracking-tight text-foreground">
        {percent}%
      </span>
    </div>
  );
}

export function GoalsSection({ t }: { t: Messages }) {
  const g = t.landing.goals;
  const goal = DEMO_FINANCE.goal;
  const percent = Math.round((goal.current / goal.target) * 100);

  return (
    <section aria-labelledby="goals-title" className="bg-surface">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-28">
        <SectionHeading id="goals-title" eyebrow={g.eyebrow} title={g.title} body={g.body} />

        <SurfaceCard className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary-ink">
              <Laptop className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-foreground">{g.goalName}</p>
              <p className="text-[13px] text-subtle">{g.daysLeft(goal.daysLeft)}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <ProgressArc percent={percent} label={g.progressLabel} />
            <dl className="grid w-full gap-5">
              <div>
                <dt className="text-[13px] text-muted">{g.saved}</dt>
                <dd className="tabular mt-1 text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {formatVND(goal.current)} <span className="text-base font-normal text-subtle">/ {formatVND(goal.target)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted">{g.monthly}</dt>
                <dd className="tabular mt-1 text-xl font-semibold tracking-[-0.02em] text-primary-ink">
                  {formatVND(goal.monthlyContribution)}
                  <span className="text-base font-normal text-muted">{g.perMonth}</span>
                </dd>
              </div>
            </dl>
          </div>
        </SurfaceCard>
      </div>
    </section>
  );
}
