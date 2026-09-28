import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_AMOUNT, MAX_PAGE_SIZE, TRANSACTION_TYPES } from "@/constants/finance";
import { isValidMonthKey, isValidYmd } from "@/lib/utils/date";

export const amountSchema = z
  .number("Số tiền phải là một con số.")
  .finite("Số tiền không hợp lệ.")
  .positive("Số tiền phải lớn hơn 0.")
  .max(MAX_AMOUNT, "Số tiền vượt quá giới hạn cho phép.");

export const ymdSchema = z.string().refine(isValidYmd, "Ngày không hợp lệ (định dạng YYYY-MM-DD).");
export const monthKeySchema = z.string().refine(isValidMonthKey, "Tháng không hợp lệ (định dạng YYYY-MM).");
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES, "Loại giao dịch phải là thu hoặc chi.");
export const categoryIdSchema = z.coerce.number().int().positive("Vui lòng chọn danh mục.");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
