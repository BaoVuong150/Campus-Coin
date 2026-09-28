/**
 * Chạy scheduler giao dịch định kỳ một lần (giống cron) – dùng khi kiểm tra hoặc khi nền tảng không có cron.
 *   npm run cron:recurring
 * Idempotent: chạy nhiều lần liên tiếp không sinh giao dịch trùng (lần sau báo created = 0).
 */
import { prisma } from "../src/lib/database/prisma";
import { runDueRecurring } from "../src/services/recurring.service";

async function main() {
  const first = await runDueRecurring();
  console.info("Lần chạy 1:", first);
  const second = await runDueRecurring();
  console.info("Lần chạy 2 (phải tạo 0 giao dịch):", second);
  if (second.created !== 0) {
    console.error("LỖI: lần chạy thứ hai vẫn tạo giao dịch – scheduler không idempotent.");
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
