import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { MAX_CUSTOM_RANGE_DAYS, daysBetween } from "@/lib/finance/report";
import { currentMonthKey } from "@/lib/utils/date";
import { categoryIdSchema, monthKeySchema, ymdSchema } from "@/lib/validations/common.schema";
import { getReport } from "@/services/analytics.service";
import { getUsableCategory } from "@/services/category.service";

const schema = z
  .object({
    period: z.enum(["month", "quarter", "year"]).default("month"),
    anchor: monthKeySchema.optional(),
    /** Lọc theo danh mục (danh mục thu = nguồn thu). */
    category_id: categoryIdSchema.optional(),
    /** Khoảng ngày tùy chọn – phải có cả hai. */
    from: ymdSchema.optional(),
    to: ymdSchema.optional(),
  })
  .refine((q) => !q.from === !q.to, { message: "Chọn cả ngày bắt đầu và ngày kết thúc.", path: ["to"] })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "Ngày bắt đầu phải trước ngày kết thúc.", path: ["to"] })
  .refine((q) => !q.from || !q.to || daysBetween(q.from, q.to).length <= MAX_CUSTOM_RANGE_DAYS, {
    message: `Khoảng ngày tối đa ${MAX_CUSTOM_RANGE_DAYS} ngày.`,
    path: ["to"],
  });

export const GET = handle(async (req) => {
  const user = await requireAuth();
  const { period, anchor, category_id, from, to } = parseQuery(req, schema);
  // Chỉ lọc theo danh mục user được dùng (chống dò danh mục riêng của người khác).
  if (category_id) await getUsableCategory(user.id, category_id);
  return ok(await getReport(user.id, period, anchor ?? currentMonthKey(), new Date(), { categoryId: category_id, from, to }));
});
