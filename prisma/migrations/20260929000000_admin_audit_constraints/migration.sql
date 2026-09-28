-- Migration chỉ BỔ SUNG, an toàn cho DB đang có dữ liệu:
--   1) Bảng nhật ký quản trị mới.
--   2) Ràng buộc CHECK dạng NOT VALID: áp dụng cho mọi dòng ghi MỚI, không quét / không từ chối dữ liệu cũ
--      (có thể VALIDATE CONSTRAINT sau khi đã kiểm tra dữ liệu cũ sạch).

-- CreateTable
CREATE TABLE "admin_audits" (
    "id" SERIAL NOT NULL,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audits_created_at_idx" ON "admin_audits"("created_at");

-- CreateIndex
CREATE INDEX "admin_audits_actor_id_created_at_idx" ON "admin_audits"("actor_id", "created_at");

-- Ràng buộc dữ liệu (NOT VALID: chỉ kiểm tra dòng mới/cập nhật)
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('student', 'admin')) NOT VALID;
ALTER TABLE "users" ADD CONSTRAINT "users_money_check" CHECK ("monthly_allowance_baseline" >= 0 AND "monthly_savings_goal" >= 0) NOT VALID;
ALTER TABLE "users" ADD CONSTRAINT "users_pay_day_check" CHECK ("salary_pay_day" IS NULL OR "salary_pay_day" BETWEEN 1 AND 31) NOT VALID;

ALTER TABLE "categories" ADD CONSTRAINT "categories_type_check" CHECK ("type" IN ('income', 'expense')) NOT VALID;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_type_check" CHECK ("type" IN ('income', 'expense')) NOT VALID;

ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_amount_check" CHECK ("amount" > 0) NOT VALID;
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_type_check" CHECK ("type" IN ('income', 'expense')) NOT VALID;
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_frequency_check" CHECK ("frequency" IN ('weekly', 'monthly', 'yearly')) NOT VALID;
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_status_check" CHECK ("status" IN ('active', 'paused', 'cancelled')) NOT VALID;

ALTER TABLE "budgets" ADD CONSTRAINT "budgets_limit_check" CHECK ("limit_amount" > 0) NOT VALID;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_month_check" CHECK ("month" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$') NOT VALID;

ALTER TABLE "saving_goals" ADD CONSTRAINT "saving_goals_amount_check" CHECK ("target_amount" > 0 AND "current_amount" >= 0) NOT VALID;
ALTER TABLE "saving_goals" ADD CONSTRAINT "saving_goals_status_check" CHECK ("status" IN ('active', 'completed', 'archived')) NOT VALID;

ALTER TABLE "point_events" ADD CONSTRAINT "point_events_points_check" CHECK ("points" > 0) NOT VALID;

-- Mẹo tiết kiệm: khóa trạng thái ghim/bỏ qua theo từng user; nhận định: một ảnh chụp mỗi tháng (lịch sử).
-- Hai bảng này trước đây chưa được dùng nên tạo unique index an toàn.
-- DropIndex
DROP INDEX IF EXISTS "insights_user_id_month_idx";

-- AlterTable
ALTER TABLE "saving_tips" ADD COLUMN "tip_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "insights_user_id_month_key" ON "insights"("user_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "saving_tips_user_id_tip_key_key" ON "saving_tips"("user_id", "tip_key");
