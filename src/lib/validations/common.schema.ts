import { z } from "zod";
import {
  AMOUNT_DECIMALS,
  DEFAULT_PAGE_SIZE,
  MAX_AMOUNT,
  MAX_DATE_YEAR,
  MAX_PAGE_SIZE,
  MIN_DATE_YEAR,
  TRANSACTION_TYPES,
} from "@/constants/finance";
import { isSupportedYear, isValidMonthKey, isValidYmd } from "@/lib/utils/date";

/**
 * Số có tối đa AMOUNT_DECIMALS chữ số thập phân (tránh 0,001 bị làm tròn thành 0 khi lưu DB).
 * Sai số cho phép tỉ lệ với độ lớn: quanh 10 tỷ × 100 ≈ 1e12, khoảng cách giữa hai số double đã ~1e-4,
 * nên dùng ngưỡng cố định 1e-6 sẽ từ chối nhầm số hợp lệ như 1.234.567.890,13.
 */
export function hasAtMostDecimals(value: number, decimals = AMOUNT_DECIMALS): boolean {
  const scaled = value * 10 ** decimals;
  return Math.abs(Math.round(scaled) - scaled) <= Math.max(1e-6, Math.abs(scaled) * Number.EPSILON * 4);
}

export const amountSchema = z
  .number("Số tiền phải là một con số.")
  .finite("Số tiền không hợp lệ.")
  .positive("Số tiền phải lớn hơn 0.")
  .max(MAX_AMOUNT, "Số tiền vượt quá giới hạn cho phép.")
  .refine((v) => hasAtMostDecimals(v), "Số tiền tối đa 2 chữ số thập phân.");

export const ymdSchema = z
  .string()
  .refine(isValidYmd, "Ngày không hợp lệ (định dạng YYYY-MM-DD).")
  .refine(isSupportedYear, `Năm phải nằm trong khoảng ${MIN_DATE_YEAR}–${MAX_DATE_YEAR}.`);
export const monthKeySchema = z
  .string()
  .refine(isValidMonthKey, "Tháng không hợp lệ (định dạng YYYY-MM).")
  .refine(isSupportedYear, `Năm phải nằm trong khoảng ${MIN_DATE_YEAR}–${MAX_DATE_YEAR}.`);
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES, "Loại giao dịch phải là thu hoặc chi.");
export const categoryIdSchema = z.coerce.number().int().positive("Vui lòng chọn danh mục.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
