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
