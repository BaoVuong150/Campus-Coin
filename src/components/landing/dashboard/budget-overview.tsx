import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { BudgetRow } from "../primitives";

/** Hai danh mục đầu của ngân sách mẫu: một mục đang cảnh báo, một mục ổn. */
export function BudgetOverview({ t }: { t: Messages }) {
  const d = t.landing.demo;
  return (
    <div className="rounded-xl bg-surface-secondary p-4">
      <p className="mb-3 text-[12px] text-muted">{d.budget}</p>
      <div className="space-y-3.5">
        {DEMO_FINANCE.budgets.slice(0, 2).map((b) => (
          <BudgetRow key={b.category} label={d.categories[b.category]} spent={b.spent} limit={b.limit} compact />
        ))}
      </div>
    </div>
  );
}
