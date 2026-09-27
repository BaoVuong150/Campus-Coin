import { z } from "zod";
import { paginationSchema } from "./common.schema";

export const adminUserQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["all", "active", "disabled"]).default("all"),
});

export const adminUpdateUserSchema = z
  .object({
    is_active: z.boolean(),
    role: z.enum(["student", "admin"]),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "Không có dữ liệu cần cập nhật.");

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tiêu đề.").max(120),
  message: z.string().trim().min(1, "Vui lòng nhập nội dung.").max(1000),
});
