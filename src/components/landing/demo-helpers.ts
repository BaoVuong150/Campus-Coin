import { DEMO_FINANCE } from "@/data/demo-finance";
import { shortMonthLabel } from "@/i18n/format";
import type { Messages } from "@/i18n";
import { currentMonthKey, parseMonthKey, shiftMonthKey } from "@/lib/utils/date";
import type { BarDatum } from "./primitives";

/** Dòng tiền mẫu của N tháng gần nhất, nhãn tháng theo ngôn ngữ và tháng hiện tại. */
export function demoCashFlow(t: Messages, months: number, now = new Date()): BarDatum[] {
  const current = currentMonthKey(now);
  return DEMO_FINANCE.cashFlow.slice(-months).map((m) => {
    const key = shiftMonthKey(current, m.offset);
    return { key, label: shortMonthLabel(t, key), income: m.income, expense: m.expense };
  });
}

export function currentMonthNumber(now = new Date()): number {
  return parseMonthKey(currentMonthKey(now)).month;
}
