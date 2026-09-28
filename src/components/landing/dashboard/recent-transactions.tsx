import { DEMO_FINANCE } from "@/data/demo-finance";
import type { Messages } from "@/i18n";
import { TransactionRow } from "../primitives";

export function RecentTransactions({ t }: { t: Messages }) {
  const d = t.landing.demo;
  return (
    <div className="px-1">
      <p className="mb-1 text-[12px] text-muted">{d.recent}</p>
      <ul>
        {DEMO_FINANCE.transactions.map((tx, i) => {
          const [name, meta] = d.transactions[i];
          return (
            <TransactionRow
              key={name}
              icon={tx.icon}
              name={name}
              meta={meta}
              amount={tx.amount}
              type={tx.type}
              typeLabel={tx.type === "income" ? d.incomeLabel : d.expenseLabel}
            />
          );
        })}
      </ul>
    </div>
  );
}
