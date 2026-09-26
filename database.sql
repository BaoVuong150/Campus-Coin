-- ==============================================================================
-- CAMPUS COIN - DATABASE SCHEMA & SEED SCRIPT (TECHWIZ 7)
-- Hạng mục: End-to-End Web Solutions
-- Hệ quản trị CSDL: PostgreSQL (Supabase / Standard PostgreSQL)
-- ==============================================================================

-- 1. BẢNG USERS (Quản lý tài khoản sinh viên & quản trị viên)
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'student' NOT NULL,
    "academic_year" VARCHAR(100),
    "monthly_allowance_baseline" NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    "monthly_savings_goal" NUMERIC(12, 2) DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. BẢNG CATEGORIES (Quản lý danh mục thu nhập & chi tiêu)
CREATE TABLE IF NOT EXISTS "categories" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(64) REFERENCES "users"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('income', 'expense')),
    "icon" VARCHAR(50),
    "color" VARCHAR(20),
    "is_default" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. BẢNG TRANSACTIONS (Lịch sử giao dịch thu/chi, hỗ trợ định kỳ & AI gợi ý)
CREATE TABLE IF NOT EXISTS "transactions" (
    "id" VARCHAR(64) PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "category_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
    "amount" NUMERIC(12, 2) NOT NULL,
    "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('income', 'expense')),
    "description" VARCHAR(500) NOT NULL,
    "ai_suggested_category" INTEGER,
    "date" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "is_recurring" BOOLEAN DEFAULT FALSE NOT NULL,
    "recurrence_period" VARCHAR(50),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. BẢNG BUDGETS (Hạn mức ngân sách hàng tháng cho từng danh mục)
CREATE TABLE IF NOT EXISTS "budgets" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "category_id" INTEGER NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
    "month" VARCHAR(10) NOT NULL, -- Định dạng YYYY-MM
    "limit_amount" NUMERIC(12, 2) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "unique_user_category_month" UNIQUE ("user_id", "category_id", "month")
);

-- 5. BẢNG INSIGHTS (Báo cáo phân tích AI hàng tháng & thói quen chi tiêu)
CREATE TABLE IF NOT EXISTS "insights" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "month" VARCHAR(10) NOT NULL,
    "summary_text" TEXT NOT NULL,
    "tip_text" TEXT NOT NULL,
    "is_pinned" BOOLEAN DEFAULT FALSE NOT NULL,
    "generated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. BẢNG SAVING_TIPS (Mẹo tiết kiệm cá nhân hóa & gợi ý từ hệ thống)
CREATE TABLE IF NOT EXISTS "saving_tips" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(64) REFERENCES "users"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "category_type" VARCHAR(100),
    "potential_saving" NUMERIC(12, 2),
    "is_pinned" BOOLEAN DEFAULT FALSE NOT NULL,
    "is_dismissed" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. BẢNG NOTIFICATIONS (Thông báo in-app: cảnh báo vượt ngân sách, tin tức)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR(64) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'info' NOT NULL,
    "is_read" BOOLEAN DEFAULT FALSE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- INDEXES TỐI ƯU TRUY VẤN
CREATE INDEX IF NOT EXISTS "idx_transactions_user_date" ON "transactions"("user_id", "date");
CREATE INDEX IF NOT EXISTS "idx_budgets_user_month" ON "budgets"("user_id", "month");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id", "is_read");

-- ==============================================================================
-- DỮ LIỆU MẪU MẶC ĐỊNH (SEED DATA)
-- ==============================================================================

-- 1. Thêm danh mục mặc định chuẩn SRS 3.2
INSERT INTO "categories" ("name", "type", "icon", "color", "is_default") VALUES
('Allowance', 'income', 'Wallet', '#10B981', TRUE),
('Part-time Job', 'income', 'Briefcase', '#3B82F6', TRUE),
('Scholarship', 'income', 'GraduationCap', '#8B5CF6', TRUE),
('Gift', 'income', 'Gift', '#EC4899', TRUE),
('Other Income', 'income', 'Coins', '#F59E0B', TRUE),
('Food', 'expense', 'Utensils', '#EF4444', TRUE),
('Transport', 'expense', 'Bus', '#F97316', TRUE),
('Hostel/Rent', 'expense', 'Home', '#6366F1', TRUE),
('Academics', 'expense', 'BookOpen', '#06B6D4', TRUE),
('Subscriptions', 'expense', 'Tv', '#14B8A6', TRUE),
('Entertainment', 'expense', 'Film', '#A855F7', TRUE),
('Miscellaneous', 'expense', 'MoreHorizontal', '#64748B', TRUE)
ON CONFLICT DO NOTHING;
