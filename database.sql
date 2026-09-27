-- ==============================================================================
-- CAMPUS COIN - DATABASE SCHEMA & SEED SCRIPT
-- Hệ quản trị CSDL: PostgreSQL (Supabase / PostgreSQL ≥ 13)
--
-- File này được sinh từ prisma/schema.prisma (source of truth) bằng:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
-- Dùng cho cài đặt mới bằng SQL thuần. Với DB đang chạy, dùng: npx prisma migrate deploy
-- Thời gian lưu dạng TIMESTAMP (UTC); ứng dụng hiển thị theo Asia/Ho_Chi_Minh.
-- ==============================================================================

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'student',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "academic_year" TEXT,
    "monthly_allowance_baseline" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthly_savings_goal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "salary_pay_day" INTEGER DEFAULT 5,
    "fixed_bills" JSONB,
    "preferences" JSONB,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ai_suggested_category" INTEGER,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_period" TEXT,
    "recurring_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "budgets" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "limit_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "summary_text" TEXT NOT NULL,
    "tip_text" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saving_tips" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category_type" TEXT,
    "potential_saving" DECIMAL(12,2),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saving_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "kind" TEXT NOT NULL DEFAULT 'system',
    "link" TEXT,
    "dedupe_key" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "categories_user_id_idx" ON "categories"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_type_date_idx" ON "transactions"("user_id", "type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_recurring_id_date_key" ON "transactions"("recurring_id", "date");

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
CREATE INDEX "budgets_user_id_month_idx" ON "budgets"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_month_key" ON "budgets"("user_id", "category_id", "month");

-- CreateIndex
CREATE INDEX "insights_user_id_month_idx" ON "insights"("user_id", "month");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_created_at_idx" ON "notifications"("user_id", "is_read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_dedupe_key_key" ON "notifications"("user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saving_tips" ADD CONSTRAINT "saving_tips_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ==============================================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- Tài khoản demo: student@campuscoin.edu / Student@123 · admin@campuscoin.edu / Admin@123
-- Dữ liệu giao dịch demo đầy đủ: SEED_RESET=true npm run db:seed
-- ==============================================================================

INSERT INTO "categories" ("name", "type", "icon", "color", "is_default") VALUES
('Trợ cấp gia đình', 'income', 'Wallet', '#059669', TRUE),
('Việc làm thêm', 'income', 'Briefcase', '#2563EB', TRUE),
('Học bổng', 'income', 'GraduationCap', '#7C3AED', TRUE),
('Quà tặng / Thưởng', 'income', 'Gift', '#DB2777', TRUE),
('Thu nhập khác', 'income', 'Coins', '#D97706', TRUE),
('Ăn uống', 'expense', 'Utensils', '#EA580C', TRUE),
('Đi lại', 'expense', 'Bus', '#0891B2', TRUE),
('Tiền trọ / KTX', 'expense', 'Home', '#4F46E5', TRUE),
('Học tập', 'expense', 'BookOpen', '#0D9488', TRUE),
('Dịch vụ số', 'expense', 'Tv', '#9333EA', TRUE),
('Giải trí', 'expense', 'Film', '#E11D48', TRUE),
('Chi tiêu khác', 'expense', 'MoreHorizontal', '#64748B', TRUE),
('Mua sắm', 'expense', 'ShoppingBag', '#DB2777', TRUE);

INSERT INTO "users" ("id", "name", "email", "password_hash", "role", "academic_year", "monthly_allowance_baseline", "monthly_savings_goal", "updated_at") VALUES
(gen_random_uuid()::text, 'Nguyễn Văn An', 'student@campuscoin.edu', '$2b$12$0DYtpOS1OVQYkqovII2uOeT9b24uuTXd5mBcDEXNFoICQ/s1eQjs.', 'student', 'Năm 3 – Công nghệ thông tin', 6500000, 800000, CURRENT_TIMESTAMP),
(gen_random_uuid()::text, 'Quản trị viên Campus Coin', 'admin@campuscoin.edu', '$2b$12$GtnbM3JuiaL8eaDGFEexGesTr7NTAP6dQ2W7P4/KvRVYSvpNc8SY6', 'admin', NULL, 0, 0, CURRENT_TIMESTAMP);
