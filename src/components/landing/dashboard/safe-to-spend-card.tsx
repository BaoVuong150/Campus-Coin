import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { formatVND } from "@/lib/utils/money";

/** Điểm khác biệt của Campus Coin: con số có thể chi mỗi ngày. */
export function SafeToSpendCard({ t }: { t: Messages }) {
  const d = t.landing.demo;
  const elapsed = DEMO_FINANCE.daysInMonth - DEMO_FINANCE.daysLeft;
  return (
    <div className="flex flex-col justify-between rounded-xl bg-primary-soft p-4 sm:p-5">
      <div>
        <p className="text-[12px] font-medium text-primary">{d.safe}</p>
        <p className="tabular mt-1 text-[26px] leading-none font-semibold whitespace-nowrap tracking-[-0.03em] text-foreground">{formatVND(DEMO_FINANCE.safeToSpend)}</p>
        <p className="mt-2 text-[12px] leading-snug text-muted">{d.safeNote}</p>
      </div>
      <div className="mt-4">
        <div className="h-1 overflow-hidden rounded-full bg-surface" aria-hidden>
          <div
            className="h-full origin-left animate-grow-x rounded-full bg-brand"
            style={{ width: `${(elapsed / DEMO_FINANCE.daysInMonth) * 100}%`, animationDelay: "400ms" }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-subtle">{d.daysLeft(DEMO_FINANCE.daysLeft)}</p>
      </div>
    </div>
  );
}
