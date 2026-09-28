import { normalizeText } from "@/lib/finance/categorize";
import { isValidYmd } from "@/lib/utils/date";
import type { TransactionType } from "@/types/finance";

export const MAX_IMPORT_ROWS = 500;

export type CsvField = "date" | "description" | "amount" | "type" | "category";
export type RowError = "date" | "description" | "amount" | "type";

/** Tên cột chấp nhận (đã chuẩn hóa, bỏ dấu) – hỗ trợ cả tiếng Việt và tiếng Anh. */
const HEADER_ALIASES: Record<CsvField, string[]> = {
  date: ["date", "ngay", "ngay giao dich", "transaction date"],
  description: ["description", "mo ta", "noi dung", "ghi chu", "note", "memo", "details"],
  amount: ["amount", "so tien", "gia tri", "value"],
  type: ["type", "loai", "loai giao dich", "kind"],
  category: ["category", "danh muc"],
};

export function mapHeaders(headers: string[]): Partial<Record<CsvField, string>> {
  const mapping: Partial<Record<CsvField, string>> = {};
  for (const header of headers) {
    const key = normalizeText(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [CsvField, string[]][]) {
      if (!mapping[field] && aliases.includes(key)) mapping[field] = header;
    }
  }
  return mapping;
}

export function hasRequiredColumns(mapping: Partial<Record<CsvField, string>>): boolean {
  return !!(mapping.date && mapping.description && mapping.amount);
}

/** "YYYY-MM-DD", "DD/MM/YYYY", "D-M-YYYY" → "YYYY-MM-DD" hoặc null. */
export function parseDate(raw: string): string | null {
  const value = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(value);
  const dmy = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  const parts = iso ? [iso[1], iso[2], iso[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : null;
  if (!parts) return null;
  const ymd = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  return isValidYmd(ymd) ? ymd : null;
}

/**
 * Số tiền kiểu Việt Nam hoặc quốc tế: "45.000", "45,000", "1.250.000 ₫", "-45000", "12.5".
 * Dấu phân cách cuối cùng là phần thập phân chỉ khi phía sau có 1–2 chữ số.
 */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const negative = cleaned.trim().startsWith("-") || /^\s*\(.*\)\s*$/.test(raw);
  const digits = cleaned.replace(/-/g, "");
  const lastSep = Math.max(digits.lastIndexOf("."), digits.lastIndexOf(","));
  let normalized: string;
  if (lastSep >= 0 && digits.length - lastSep - 1 <= 2 && digits.length - lastSep - 1 > 0) {
    normalized = `${digits.slice(0, lastSep).replace(/[.,]/g, "")}.${digits.slice(lastSep + 1)}`;
  } else {
    normalized = digits.replace(/[.,]/g, "");
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value === 0) return null;
  return negative ? -value : value;
}

const INCOME_WORDS = ["income", "thu", "thu nhap", "in", "+"];
const EXPENSE_WORDS = ["expense", "chi", "chi tieu", "out", "-"];

/** Loại giao dịch: theo cột type; nếu trống thì số âm là chi, còn lại mặc định là chi tiêu. */
export function parseType(raw: string | undefined, amount: number): TransactionType | null {
  const key = raw ? normalizeText(raw) || raw.trim() : "";
  if (!key) return "expense";
  if (INCOME_WORDS.includes(key)) return amount < 0 ? null : "income";
  if (EXPENSE_WORDS.includes(key)) return "expense";
  return null;
}

export interface ParsedRow {
  /** Số dòng trong file (tính cả dòng tiêu đề). */
  line: number;
  date: string | null;
  description: string;
  amount: number;
  type: TransactionType;
  categoryName: string | null;
  errors: RowError[];
}

export function parseRecords(records: Record<string, string>[], mapping: Partial<Record<CsvField, string>>): ParsedRow[] {
  const get = (record: Record<string, string>, field: CsvField) => (mapping[field] ? (record[mapping[field]!] ?? "").trim() : "");

  return records.map((record, index) => {
    const errors: RowError[] = [];
    const date = parseDate(get(record, "date"));
    if (!date) errors.push("date");
    const description = get(record, "description").slice(0, 200);
    if (!description) errors.push("description");
    const signed = parseAmount(get(record, "amount"));
    if (signed === null) errors.push("amount");
    const type = parseType(get(record, "type"), signed ?? 0);
    if (!type) errors.push("type");
    return {
      line: index + 2,
      date,
      description,
      amount: Math.abs(signed ?? 0),
      type: type ?? "expense",
      categoryName: get(record, "category") || null,
      errors,
    };
  });
}
