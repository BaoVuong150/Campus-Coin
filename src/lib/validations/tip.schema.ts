import { z } from "zod";
import { amountSchema } from "./common.schema";

export const tipActionSchema = z.object({
  key: z.string().min(1).max(120),
  action: z.enum(["pin", "unpin", "dismiss", "restore"]),
});

export const systemTipSchema = z.object({
  title: z.string("Vui lòng nhập tiêu đề.").trim().min(1, "Vui lòng nhập tiêu đề.").max(120),
  content: z.string("Vui lòng nhập nội dung.").trim().min(1, "Vui lòng nhập nội dung.").max(1000),
  potential_saving: amountSchema.nullish(),
});

export const insightPinSchema = z.object({ pinned: z.boolean() });
