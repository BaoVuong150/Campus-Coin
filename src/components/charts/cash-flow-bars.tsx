"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "@/hooks/use-chart-colors";
import { formatCompact, formatVND } from "@/lib/utils/money";
import type { CashFlowPoint } from "@/types/finance";
import { ChartTooltip, LegendDot } from "./chart-tooltip";

const SERIES_LABELS = { income: "Thu nhập", expense: "Chi tiêu" };

interface Props {
  data: CashFlowPoint[];
  height?: number;
}

/** Cột nhóm Thu/Chi theo kỳ; một trục Y duy nhất, tooltip khi hover, legend luôn hiện. */
export function CashFlowBars({ data, height = 260 }: Props) {
  const colors = useChartColors();
  const dense = data.length > 14;
  return (
    <div>
      <div className="mb-3 flex items-center gap-4" aria-hidden>
        <LegendDot color={colors.income} label={SERIES_LABELS.income} />
        <LegendDot color={colors.expense} label={SERIES_LABELS.expense} />
      </div>
      <table className="sr-only">
        <caption>Thu nhập và chi tiêu theo kỳ</caption>
        <thead>
          <tr>
            <th scope="col">Kỳ</th>
            <th scope="col">{SERIES_LABELS.income}</th>
            <th scope="col">{SERIES_LABELS.expense}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
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
          <BarChart data={data} barGap={2} barCategoryGap={dense ? "20%" : "28%"} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.6 }}
              content={(props) => <ChartTooltip {...props} labels={SERIES_LABELS} />}
            />
            <Bar dataKey="income" name={SERIES_LABELS.income} fill={colors.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" name={SERIES_LABELS.expense} fill={colors.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
