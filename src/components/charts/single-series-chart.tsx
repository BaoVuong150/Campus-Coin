"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartColors } from "@/hooks/use-chart-colors";
import { formatNumber, formatVND } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";

interface Props<T extends { key: string }> {
  data: T[];
  dataKey: keyof T & string;
  name: string;
  kind: "area" | "bar";
  format?: "money" | "number";
  height?: number;
}

/** Biểu đồ một chuỗi số liệu: tiêu đề card đã nêu tên chuỗi nên không cần legend. */
export function SingleSeriesChart<T extends { key: string }>({ data, dataKey, name, kind, format = "number", height = 220 }: Props<T>) {
  const colors = useChartColors();
  const { fmt } = useI18n();
  const points = data.map((d) => ({ ...d, label: fmt.bucket(d.key) }));
  const color = colors.series[0];
  const formatValue = (v: number) => (format === "money" ? formatVND(v) : formatNumber(v));
  const axis = { tickLine: false, axisLine: false, tick: { fill: colors.axis, fontSize: 11 } };
  const tooltip = (
    <Tooltip
      cursor={kind === "bar" ? { fill: colors.grid, opacity: 0.6 } : { stroke: colors.axis, strokeDasharray: "3 3" }}
      content={({ active, payload, label }) =>
        active && payload?.[0] ? (
          <div className="rounded-md border border-border bg-surface px-3 py-2 text-[12px] shadow-pop">
            <p className="font-medium text-foreground">{label}</p>
            <p className="tabular text-muted">
              {name}: <span className="font-medium text-foreground">{formatValue(Number(payload[0].value))}</span>
            </p>
          </div>
        ) : null
      }
    />
  );

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "area" ? (
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={40} allowDecimals={false} tickFormatter={(v: number) => (format === "money" ? fmt.compact(v) : formatNumber(v))} />
            {tooltip}
            <Area type="monotone" dataKey={dataKey as string} name={name} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.12} dot={{ r: 3, fill: color, stroke: colors.surface, strokeWidth: 2 }} />
          </AreaChart>
        ) : (
          <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} width={44} tickFormatter={(v: number) => (format === "money" ? fmt.compact(v) : formatNumber(v))} />
            {tooltip}
            <Bar dataKey={dataKey as string} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
