import { z } from "zod";
import { MAX_IMPORT_ROWS } from "@/lib/csv/transactions-csv";
import { transactionTypeSchema } from "./common.schema";
import { createTransactionSchema } from "./transaction.schema";

export const importTransactionsSchema = z.object({
  rows: z
    .array(createTransactionSchema.omit({ suggested_category_id: true }))
    .min(1, "Không có dòng nào để nhập.")
    .max(MAX_IMPORT_ROWS, `Tối đa ${MAX_IMPORT_ROWS} dòng mỗi lần.`),
  skip_duplicates: z.boolean().default(true),
});

export const suggestBatchSchema = z.object({
  items: z
    .array(z.object({ text: z.string().trim().min(1).max(200), type: transactionTypeSchema }))
    .min(1)
    .max(MAX_IMPORT_ROWS),
});

export type ImportTransactionsInput = z.infer<typeof importTransactionsSchema>;
