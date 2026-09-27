import { PrismaClient } from "@prisma/client";
import {
  CANONICAL_CATEGORY_NAMES,
  fallbackCategory,
  matchRule,
  normalizeText,
} from "../../src/lib/finance/categorize";

/**
 * Sửa giao dịch có loại (thu/chi) không khớp loại danh mục – dữ liệu sinh ra từ phiên bản cũ
 * (mặc định category_id = 1). Loại giao dịch được giữ nguyên, chỉ gán lại danh mục cùng loại
 * bằng quy tắc smart categorization; không khớp thì dùng "Chi tiêu khác" / "Thu nhập khác".
 *
 *   npm run db:fix-categories            # xem trước (dry-run)
 *   npm run db:fix-categories -- --apply # ghi vào DB, kèm audit
 */
const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const defaults = await prisma.category.findMany({ where: { user_id: null } });
  const byCanonical = (canonical: keyof typeof CANONICAL_CATEGORY_NAMES) =>
    defaults.find((c) => normalizeText(c.name) === CANONICAL_CATEGORY_NAMES[canonical]);

  // Prisma không so sánh được hai cột, nên lọc id bằng SQL rồi mới nạp chi tiết.
  const ids = await prisma.$queryRaw<{ id: string }[]>`
    SELECT t.id FROM transactions t JOIN categories c ON c.id = t.category_id WHERE t.type <> c.type`;
  const rows = await prisma.transaction.findMany({
    where: { id: { in: ids.map((r) => r.id) } },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  if (rows.length === 0) {
    console.log("Không có giao dịch nào bị lệch loại danh mục.");
    return;
  }

  const plan = rows.map((t) => {
    const type = t.type === "income" ? "income" : "expense";
    const rule = matchRule(t.description, type);
    const target = (rule && byCanonical(rule.category)) || byCanonical(fallbackCategory(type));
    if (!target) throw new Error(`Thiếu danh mục mặc định cho loại "${type}".`);
    return { tx: t, target };
  });

  for (const { tx, target } of plan) {
    console.log(`${tx.id.slice(0, 8)}  ${tx.description.padEnd(28)} ${tx.category.name} → ${target.name}`);
  }

  if (!apply) {
    console.log(`\n${plan.length} giao dịch sẽ được sửa. Chạy lại với --apply để ghi vào DB.`);
    return;
  }

  await prisma.$transaction(
    plan.flatMap(({ tx, target }) => [
      prisma.transactionAudit.create({
        data: {
          transaction_id: tx.id,
          user_id: tx.user_id,
          action: "update",
          snapshot: { category_id: tx.category_id, reason: "fix-category-mismatch" },
        },
      }),
      prisma.transaction.update({ where: { id: tx.id }, data: { category_id: target.id } }),
    ])
  );
  console.log(`\nĐã sửa ${plan.length} giao dịch.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
