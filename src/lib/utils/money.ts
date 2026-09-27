const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** 1250000 → "1.250.000 ₫" */
export function formatVND(value: number): string {
  return vndFormatter.format(Math.round(value)).replace(/ /g, " ");
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

/** Rút gọn cho trục biểu đồ: 1250000 → "1,3tr", 85000 → "85k". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}${trim(abs / 1_000_000_000)}tỷ`;
  if (abs >= 1_000_000) return `${sign}${trim(abs / 1_000_000)}tr`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

function trim(n: number) {
  return n.toFixed(1).replace(/\.0$/, "").replace(".", ",");
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(/\.0$/, "").replace(".", ",")}%`;
}

/** Ô nhập tiền: "5000000" → "5.000.000" */
export function formatCurrencyInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const digits = String(value).replace(/\D/g, "");
  return digits ? numberFormatter.format(Number(digits)) : "";
}

/** "5.000.000" → 5000000 */
export function parseCurrencyInput(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

/** % thay đổi so với kỳ trước; null khi kỳ trước bằng 0 (không so sánh được). */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
