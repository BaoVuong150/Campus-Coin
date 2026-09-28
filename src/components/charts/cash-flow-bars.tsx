"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "@/hooks/use-chart-colors";
import { formatVND } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";
import type { CashFlowPoint } from "@/types/finance";
import { ChartTooltip, LegendDot } from "./chart-tooltip";

interface Props {
  data: CashFlowPoint[];
  height?: number;
}

/** Cột nhóm Thu/Chi theo kỳ; một trục Y duy nhất, tooltip khi hover, legend luôn hiện. */
export function CashFlowBars({ data, height = 260 }: Props) {
  const colors = useChartColors();
  const { t, fmt } = useI18n();
  const labels = { income: t.common.income, expense: t.common.expense };
  const points = data.map((d) => ({ ...d, label: fmt.bucket(d.key) }));
  const dense = data.length > 14;
  return (
    <div>
      <div className="mb-3 flex items-center gap-4" aria-hidden>
        <LegendDot color={colors.income} label={labels.income} />
        <LegendDot color={colors.expense} label={labels.expense} />
      </div>
      <table className="sr-only">
        <caption>{t.dashboard.cashFlow.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{t.dashboard.cashFlow.period}</th>
            <th scope="col">{labels.income}</th>
            <th scope="col">{labels.expense}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{formatVND(d.income)}</td>
              <td>{formatVND(d.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ height }} className="w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} barGap={2} barCategoryGap={dense ? "20%" : "28%"} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: colors.axis, fontSize: 11 }}
              interval={dense ? "preserveStartEnd" : 0}
              minTickGap={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: colors.axis, fontSize: 11 }}
              tickFormatter={(v: number) => fmt.compact(v)}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.6 }}
              content={(props) => <ChartTooltip {...props} labels={labels} />}
            />
            <Bar dataKey="income" name={labels.income} fill={colors.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" name={labels.expense} fill={colors.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
