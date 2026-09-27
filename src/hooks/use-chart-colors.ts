"use client";

import { useEffect, useState } from "react";

export interface ChartColors {
  income: string;
  expense: string;
  grid: string;
  axis: string;
  surface: string;
  foreground: string;
  muted: string;
  series: string[];
  other: string;
}

const FALLBACK: ChartColors = {
  income: "#0d9488",
  expense: "#e5484d",
  grid: "#e6eeed",
  axis: "#647677",
  surface: "#ffffff",
  foreground: "#0b1716",
  muted: "#56686a",
  series: ["#2a78d6", "#eb6834", "#0f9f94", "#eda100", "#e87ba4", "#4d7c0f", "#4a3aa7", "#e34948"],
  other: "#a2b0b0",
};

function read(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    income: v("--chart-income", FALLBACK.income),
    expense: v("--chart-expense", FALLBACK.expense),
    grid: v("--chart-grid", FALLBACK.grid),
    axis: v("--chart-axis", FALLBACK.axis),
    surface: v("--surface", FALLBACK.surface),
    foreground: v("--foreground", FALLBACK.foreground),
    muted: v("--muted", FALLBACK.muted),
    series: FALLBACK.series.map((c, i) => v(`--chart-${i + 1}`, c)),
    other: v("--chart-other", FALLBACK.other),
  };
}

/** Màu biểu đồ lấy từ design token; tự cập nhật khi đổi sáng/tối. */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(FALLBACK);
  useEffect(() => {
    const update = () => setColors(read());
    update();
    window.addEventListener("campuscoin:theme", update);
    return () => window.removeEventListener("campuscoin:theme", update);
  }, []);
  return colors;
}
