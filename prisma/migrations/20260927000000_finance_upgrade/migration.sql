-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "preferences" JSONB;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "recurring_id" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "dedupe_key" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'system',
ADD COLUMN     "link" TEXT;

-- CreateTable
CREATE TABLE "transaction_audits" (
    "id" SERIAL NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "anchor_day" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "next_run_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_fixed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" DECIMAL(12,2) NOT NULL,
    "current_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saving_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_contributions" (
    "id" SERIAL NOT NULL,
    "goal_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL DEFAULT 1,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_audits_user_id_created_at_idx" ON "transaction_audits"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "transaction_audits_transaction_id_idx" ON "transaction_audits"("transaction_id");

-- CreateIndex
CREATE INDEX "recurring_transactions_user_id_status_idx" ON "recurring_transactions"("user_id", "status");

-- CreateIndex
CREATE INDEX "recurring_transactions_status_next_run_date_idx" ON "recurring_transactions"("status", "next_run_date");

-- CreateIndex
CREATE INDEX "saving_goals_user_id_status_idx" ON "saving_goals"("user_id", "status");

-- CreateIndex
CREATE INDEX "goal_contributions_goal_id_created_at_idx" ON "goal_contributions"("goal_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "category_preferences_user_id_keyword_key" ON "category_preferences"("user_id", "keyword");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_date_idx" ON "transactions"("user_id", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_recurring_id_date_key" ON "transactions"("recurring_id", "date");

-- CreateIndex
CREATE INDEX "budgets_user_id_month_idx" ON "budgets"("user_id", "month");

-- CreateIndex
CREATE INDEX "insights_user_id_month_idx" ON "insights"("user_id", "month");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_dedupe_key_key" ON "notifications"("user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_fkey" FOREIGN KEY ("recurring_id") REFERENCES "recurring_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_goals" ADD CONSTRAINT "saving_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_contributions" ADD CONSTRAINT "goal_contributions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "saving_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_preferences" ADD CONSTRAINT "category_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_preferences" ADD CONSTRAINT "category_preferences_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- DataMigration: chuyển users.fixed_bills (JSON) sang recurring_transactions.
-- Kỳ đầu tiên bắt đầu từ tháng kế tiếp (giờ VN 12:00 = 05:00 UTC) để không trùng với khoản đã trả tay trong tháng hiện tại.
INSERT INTO "recurring_transactions"
  ("id", "user_id", "category_id", "name", "amount", "type", "frequency", "anchor_day",
   "start_date", "next_run_date", "status", "is_fixed", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  u."id",
  COALESCE(
    (SELECT c."id" FROM "categories" c
      WHERE c."id" = NULLIF(bill->>'category_id', '')::int AND c."type" = 'expense'
        AND (c."user_id" IS NULL OR c."user_id" = u."id")),
    (SELECT c."id" FROM "categories" c WHERE c."type" = 'expense' AND c."is_default" = true ORDER BY c."id" DESC LIMIT 1)
  ),
  LEFT(COALESCE(NULLIF(TRIM(bill->>'name'), ''), 'Chi phí cố định'), 120),
  (bill->>'amount')::numeric,
  'expense',
  'monthly',
  anchor.day,
  next_month.first_day + INTERVAL '5 hours',
  (next_month.first_day + ((LEAST(anchor.day, EXTRACT(DAY FROM (next_month.first_day + INTERVAL '1 month - 1 day'))::int) - 1) * INTERVAL '1 day')) + INTERVAL '5 hours',
  'active',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "users" u
CROSS JOIN LATERAL jsonb_array_elements(
  CASE WHEN jsonb_typeof(u."fixed_bills") = 'array' THEN u."fixed_bills" ELSE '[]'::jsonb END
) AS bill
CROSS JOIN LATERAL (
  SELECT GREATEST(1, LEAST(31, COALESCE(NULLIF(bill->>'dueDay', '')::int, 1))) AS day
) AS anchor
CROSS JOIN LATERAL (
  SELECT (date_trunc('month', (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')) + INTERVAL '1 month')::timestamp AS first_day
) AS next_month
WHERE (bill->>'amount') ~ '^[0-9]+(\.[0-9]+)?$' AND (bill->>'amount')::numeric > 0;

-- DataMigration: bổ sung danh mục mặc định "Mua sắm" cho smart categorization (Shopee, Lazada...).
INSERT INTO "categories" ("user_id", "name", "type", "icon", "color", "is_default", "created_at")
SELECT NULL, 'Mua sắm', 'expense', 'ShoppingBag', '#DB2777', true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "user_id" IS NULL AND "name" = 'Mua sắm');
