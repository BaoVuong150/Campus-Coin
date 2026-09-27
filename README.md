# Campus Coin

> Quản lý tiền thông minh cho đời sống sinh viên – *Spend smarter. Study easier.*
> Dự án Techwiz 7 (Aptech) · NextGen BudgetBee · End-to-End Web Solutions

Campus Coin giúp sinh viên ghi thu chi trong vài giây, đặt ngân sách theo danh mục, theo dõi mục tiêu tiết kiệm
và luôn biết **mỗi ngày còn tiêu được bao nhiêu** đến cuối tháng. Mọi con số (Safe-to-Spend, dự báo, nhận định,
cảnh báo bất thường) đều tính bằng quy tắc thống kê trên dữ liệu thật của người dùng – có giải thích cách tính, không dùng LLM.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL (Supabase) · Recharts · Zod · Vitest.

---

## 1. Cài đặt

```bash
npm install
cp .env.example .env        # điền DATABASE_URL, JWT_SECRET (≥ 32 ký tự)
npx prisma migrate deploy   # tạo/cập nhật bảng (chỉ bổ sung, không xóa dữ liệu)
npm run dev                 # http://localhost:3000
```

- Xin chuỗi kết nối DB qua kênh riêng của nhóm – **không** commit `.env` hay dán secret vào README/issue.
- Thiếu `JWT_SECRET` → server báo lỗi cấu hình (không có giá trị dự phòng).
- DB mới hoàn toàn: có thể chạy `database.sql` (sinh từ Prisma schema) hoặc `npx prisma migrate deploy`.
- Dữ liệu demo đầy đủ (**xóa toàn bộ dữ liệu cũ**): `SEED_RESET=true npm run db:seed`.

### Tài khoản demo

| Vai trò | Email | Mật khẩu | Cổng đăng nhập |
| --- | --- | --- | --- |
| Sinh viên | `student@campuscoin.edu` | `Student@123` | `/login` |
| Quản trị viên | `admin@campuscoin.edu` | `Admin@123` | `/admin/login` |

### Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` / `build` / `start` | Chạy dev, build production, chạy production |
| `npm run lint` / `npm run typecheck` | ESLint, TypeScript |
| `npm test` | Unit/integration test (Vitest) cho logic tài chính, auth, phân quyền, IDOR |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Nạp dữ liệu demo (cần `SEED_RESET=true`) |
| `npm run db:fix-categories` | Kiểm tra giao dịch có danh mục lệch loại thu/chi (dry-run); thêm `-- --apply` để sửa, có audit |

---

## 2. Tính năng

| Khu vực | Nội dung |
| --- | --- |
| **Tổng quan** | Số dư, thu/chi tháng (so với tháng trước), ngân sách còn lại, *Số tiền có thể chi*, *Dự kiến cuối tháng*, dòng tiền 7 ngày → 12 tháng, chi tiêu theo danh mục (click để lọc giao dịch), ngân sách, giao dịch gần đây, nhận định, mục tiêu |
| **Giao dịch** | Tìm kiếm (debounce), lọc thu/chi, danh mục, khoảng ngày, khoảng tiền; sắp xếp; phân trang phía server; bảng (desktop) / thẻ (mobile); chi tiết, sửa, xóa có xác nhận; lưu vết kiểm toán |
| **Thêm giao dịch** | Toggle thu/chi, ô số tiền lớn, *Gợi ý danh mục* theo mô tả (user luôn đổi được), chọn danh mục bằng icon, lặp lại định kỳ; cảnh báo trùng lặp và khoản chi bất thường trước khi lưu |
| **Ngân sách** | Chọn tháng, tổng quan, thêm/sửa/xóa, sao chép từ tháng trước; cảnh báo ≥ 80% và khi vượt |
| **Định kỳ & chi phí cố định** | Tiền nhà, Netflix, trợ cấp… trạng thái Đang chạy / Tạm dừng / Đã hủy; scheduler tự ghi giao dịch khi đến hạn, **idempotent** |
| **Mục tiêu tiết kiệm** | Nạp / rút tiền, sửa, hoàn thành, số ngày còn lại, số tiền cần để dành mỗi tháng |
| **Báo cáo** | Tháng / quý / năm: tổng kết, xu hướng, danh mục, top chi tiêu, giao dịch lớn nhất, hiệu quả ngân sách; **xuất PDF** (font tiếng Việt, biểu đồ vector) |
| **Nhập CSV** | Tải file mẫu; nhận cột tiếng Việt/tiếng Anh, ngày `YYYY-MM-DD`/`DD/MM/YYYY`, số tiền `45.000`/`-45000`; xem trước, gợi ý danh mục hàng loạt, sửa từng dòng, bỏ qua giao dịch trùng; tối đa 500 dòng |
| **Campus Points** | Điểm thưởng nội bộ (không phải tiền, không quy đổi): +10 giao dịch đầu tiên, +2 mỗi ngày có ghi chép, +5 để dành cho mục tiêu, +10 giữ ngân sách trọn tuần, +25 đạt tiết kiệm tháng, +25 hoàn thành mục tiêu; cấp độ, chuỗi ngày, thành tựu |
| **Song ngữ** | Tiếng Việt / English – nút VI/EN trên header, trang đăng nhập, landing và trong Cài đặt |
| **Thông báo** | Ngân sách, định kỳ, mục tiêu, chi tiêu bất thường, hệ thống; chống spam bằng `dedupe_key`; đánh dấu đã đọc |
| **Cài đặt** | Hồ sơ, giao diện sáng/tối + cỡ chữ, tiền tệ/múi giờ, thiết lập tài chính, danh mục cá nhân, tùy chọn thông báo, đổi mật khẩu |
| **Quản trị** | Tổng quan hệ thống (người dùng hoạt động, tăng trưởng, khối lượng giao dịch, phân bổ danh mục), quản lý người dùng (vô hiệu hóa, phân quyền), danh mục mặc định, thông báo toàn hệ thống |

### Cách tính các chỉ số

- **Số tiền có thể chi / ngày** = (số dư + thu nhập định kỳ sắp nhận − chi phí cố định còn lại − tiền đang để dành cho mục tiêu − tiết kiệm tháng cần giữ) ÷ số ngày còn lại; nếu có ngân sách thì lấy mức thấp hơn giữa kết quả này và *ngân sách còn lại ÷ số ngày*. (`src/lib/finance/safe-to-spend.ts`)
- **Dự kiến cuối tháng** = số dư + thu định kỳ sắp nhận − chi cố định còn lại − tốc độ chi linh hoạt/ngày × số ngày còn lại. Dưới 7 ngày đầu tháng dùng trung bình 3 tháng trước. (`forecast.ts`)
- **Chi tiêu bất thường**: lớn hơn mean + 2σ lịch sử chi, hoặc gấp 3 lần trung bình danh mục (cần ≥ 5 mẫu). (`anomaly.ts`)
- **Gợi ý danh mục**: lựa chọn trước đây của chính user → lịch sử của chính user → từ khóa merchant (GrabFood, Shopee, CGV…) → danh mục mặc định. Không đọc dữ liệu người khác. (`categorize.ts`, `category.service.ts`)
- **Nhận định**: so sánh tuần/tháng, ngày chi nhiều nhất, chuỗi giữ ngân sách… chỉ sinh khi đủ dữ liệu. (`insights.ts`)

---

## 3. Kiến trúc

```
UI (app/(app)/*, components/*) → hooks (use-*.ts, apiFetch) → API routes (app/api/*)
  → lib/auth (requireAuth/requireAdmin) + lib/validations (Zod) → services/* → lib/finance (pure) → Prisma → PostgreSQL
```

```
prisma/
  schema.prisma          # source of truth
  migrations/            # 0_init (baseline) + các migration bổ sung
  seed.ts                # dữ liệu demo, ngày tương đối theo hôm nay
src/
  app/
    (app)/               # trang cần đăng nhập: dashboard, transactions, budgets, reports, goals,
                         # recurring, notifications, settings, admin/* (layout kiểm tra phiên ở server)
    api/                 # route handlers mỏng: auth → validate → service → response chuẩn
    login, register, admin/login, page.tsx (landing + sitemap)
  components/
    ui/                  # Button, Card, Field, Dialog/Sheet, Segmented, Progress, Skeleton…
    common/ layout/ dashboard/ transactions/ budgets/ goals/ recurring/ reports/ settings/ charts/ auth/
  hooks/                 # use-api (cache + invalidate), use-transactions, use-budget, use-dashboard, use-points…
  i18n/                  # config, messages/vi.ts + en.ts, provider (useI18n), server (getLocale), format, templates
  lib/
    auth/                # jwt, session (requireAuth/requireRole/requireAdmin), ownership, cookies, rate-limit
    api/                 # ApiError, response helpers, params
    validations/         # *.schema.ts (Zod) dùng chung
    finance/             # logic thuần: budget, forecast, safe-to-spend, anomaly, insights, categorize, recurring, goals, points
    csv/                 # parser CSV nhập giao dịch
    utils/               # date (Asia/Ho_Chi_Minh), money (VND), cn
  services/              # transaction, budget, category, analytics, planning, recurring, goal, notification, points, import, user, admin
  types/ constants/ context/
tests/                   # Vitest
```

### API

Mọi response có dạng thống nhất:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "TRANSACTION_NOT_FOUND", "message": "Không tìm thấy giao dịch." } }
```

### Bảo mật

- JWT HS256 trong cookie `httpOnly`, `sameSite=lax`, `secure` ở production; không có secret dự phòng.
- Mỗi request đối chiếu user trong DB (còn tồn tại, còn hoạt động, role hiện tại) → vô hiệu hóa/đổi quyền có hiệu lực ngay.
- `/api/admin/*` kiểm tra `requireAdmin()` ở server; layout admin cũng kiểm tra riêng. Proxy chỉ là lớp chuyển hướng.
- Mọi truy vấn dữ liệu cá nhân đều lọc theo `user_id`; truy cập tài nguyên của người khác trả 404 (chống IDOR).
- Đăng nhập: thông báo lỗi chung "Email hoặc mật khẩu không chính xác.", bcrypt (cost 12), rate limit đăng nhập/đăng ký.
- Mật khẩu tối thiểu 8 ký tự gồm chữ và số. Admin API không bao giờ trả `password_hash`.

### Giao dịch định kỳ

Scheduler chạy "lazy" khi người dùng mở app, và có endpoint cron `GET /api/cron/recurring`
(header `Authorization: Bearer $CRON_SECRET`). Unique `(recurring_id, date)` + cập nhật có điều kiện đảm bảo không sinh giao dịch trùng
dù chạy lặp hoặc song song.

### Song ngữ (i18n)

- Không dùng thư viện ngoài: `src/i18n/messages/vi.ts` là từ điển chuẩn, `en.ts` bắt buộc cùng cấu trúc (thiếu key → lỗi TypeScript).
- Ngôn ngữ lưu trong cookie `campuscoin_locale` (mặc định theo `Accept-Language`, rồi tiếng Việt) nên server component, metadata và `<html lang>` cũng đúng ngôn ngữ.
- Client dùng `useI18n()` → `{ t, fmt, locale, setLocale }`; server dùng `getServerMessages()`.
- Nội dung sinh ở server (thông báo, nhận định) trả về `template + params`, client tự dịch; danh mục mặc định được dịch theo tên chuẩn. Tiền tệ (VND) và ngày (`dd/MM/yyyy`) giữ theo khu vực Việt Nam ở cả hai ngôn ngữ.

### Ngày giờ

DB lưu thời điểm UTC; mọi phép tính ngày/tháng quy về **Asia/Ho_Chi_Minh**. Giao dịch chỉ có ngày được lưu lúc 12:00 giờ VN.
Hiển thị `dd/MM/yyyy`, tiền `1.250.000 ₫`. Không hard-code tháng/năm trong logic.

---

## 4. Quy tắc làm việc (xem thêm `AGENTS.md`)

- Không dùng `alert/confirm/prompt` của trình duyệt – dùng Toast (tối đa 1 toast) và ConfirmDialog.
- Mọi `<form>` có `noValidate`, lỗi hiển thị inline.
- Trước khi push: `npm run lint && npm run typecheck && npm test && npm run build`.
