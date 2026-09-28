import { z } from "zod";
import { MAX_NAME_LENGTH } from "@/constants/finance";
import { transactionTypeSchema } from "./common.schema";

export const createCategorySchema = z.object({
  name: z.string("Vui lòng nhập tên danh mục.").trim().min(1, "Vui lòng nhập tên danh mục.").max(MAX_NAME_LENGTH),
  type: transactionTypeSchema,
  icon: z.string().trim().max(40).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Màu phải ở dạng #RRGGBB.")
    .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const suggestCategorySchema = z.object({
  text: z.string().trim().min(1).max(200),
  type: z.enum(["income", "expense"]).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
