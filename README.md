# Campus Coin

> Quản lý tiền thông minh cho đời sống sinh viên – *Spend smarter. Study easier.*
> Dự án Techwiz 7 (Aptech) · NextGen BudgetBee · End-to-End Web Solutions

🔗 **Trang web đang chạy thực tế (Live Production on Vercel):**  
👉 **[https://campus-coin-psi.vercel.app](https://campus-coin-psi.vercel.app)**

---

## 🌟 Tóm tắt nâng cấp & Bàn giao hệ thống (Pre-Submission Handover)

> **Dành cho thành viên nhóm và AI tiếp quản dự án:** Toàn bộ hệ thống đã được kiểm thử, tối ưu hóa hạ tầng và triển khai thành công 100% trước hạn nộp TechWiz 7 (29/09). Dưới đây là các phần việc đã hoàn thiện từ tối đến giờ:

### 1. Triển khai đám mây (Production Deployment on Vercel)
- **URL chính thức:** `https://campus-coin-psi.vercel.app`
- **Cơ sở dữ liệu:** Supabase PostgreSQL Cloud (Singapore `ap-southeast-1`).
- **Khắc phục kết nối Serverless:** Tích hợp đường truyền **Supabase Connection Pooler IPv4** (`aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`), giải quyết triệt để vấn đề mạng IPv6 timeout giữa AWS Lambda (Vercel) và Supabase.
- **Tự động build Prisma:** Cấu hình build script `"build": "prisma generate && next build"` trong `package.json` đảm bảo Vercel luôn sinh mới client trước khi đóng gói.

### 2. Kiến trúc Chống sập & Tự phục hồi CSDL (Database Resilience Engine)
- **Mã nguồn:** `src/lib/database/resilience.ts` & `tests/services/resilience.test.ts`.
- **Circuit Breaker Pattern:** Cầu dao tự ngắt bảo vệ máy chủ (State machine: `CLOSED`, `OPEN`, `HALF_OPEN`). Ngắt nhanh (Fail-Fast) khi lỗi liên tiếp chạm ngưỡng 5 lần để tránh treo luồng Node.js và tràn RAM; tự động thăm dò phục hồi sau 10 giây.
- **Smart Retry:** Thử lại tự động theo hàm mũ kèm jitter (`withSmartRetry`: 200ms -> 500ms -> 1250ms) chống hiện tượng stampede khi mạng chập chờn.
- **Active Ping:** Đo độ trễ thời gian thực chính xác từng mili-giây qua truy vấn siêu nhẹ `SELECT 1`.

### 3. Nâng cấp Bảng điều khiển Quản trị viên (Admin Portal)
- **Widget Giám sát Trạng thái Hệ thống (`/admin`):**
  - Hiển thị trực quan Ping PostgreSQL (ms), Trạng thái Cầu dao Circuit Breaker, Thuật toán Smart Retry, Server Uptime và Bộ nhớ RAM Heap Node.js.
  - Tích hợp nút **"Kiểm tra lại"** tương tác đo Live Ping trực tiếp.
- **Xuất danh sách Sinh viên (`/admin/users`):**
  - Endpoint `GET /api/admin/users/export` tích hợp nút **"Xuất danh sách (CSV)"** trên header trang quản trị.
  - Hỗ trợ mã hóa **UTF-8 BOM (`\uFEFF`)** chuẩn quốc tế giúp mở trên Microsoft Excel hiển thị tiếng Việt có dấu chuẩn 100% không vỡ font.

### 4. Tinh gọn Giao diện & Trải nghiệm Người dùng (Dashboard & Navigation)
- **Mức Tiết kiệm hàng tháng:** Được đưa ra ngoài hiển thị trực tiếp ngay trong thẻ **"Số tiền có thể chi"** (Safe-to-Spend) trên Dashboard, kèm modal chỉnh sửa nhanh.
- **Mục tiêu tiết kiệm:** đã bật lại đầy đủ (menu, thanh điều hướng mobile, dashboard, landing) kèm lưu trữ/khôi phục – xem mục 5.
- **Sitemap trực quan:** Tích hợp khối Sitemap chi tiết ở chân Trang chủ theo đúng yêu cầu mục số 5 trong thông báo nộp bài của Aptech.

### 5. Chất lượng & Kiểm thử (Quality Assurance)
- **Unit & Integration Tests:** xem kết quả mới nhất bằng `npm test` / `npm run test:coverage`; CI (GitHub Actions) chạy lint, typecheck, test, build cho mọi push/PR.
- **TypeScript:** `npm run typecheck`.
- **Next.js Production Build:** `npm run build`.
- **File CSDL nộp bài:** `database.sql` đã sẵn sàng ở thư mục gốc chứa cấu trúc bảng và dữ liệu mẫu (Seed Data).

---

## 1. Cài đặt

Yêu cầu: Node.js ≥ 20.9 (khuyến nghị 22), PostgreSQL ≥ 13 (Supabase/Neon/local).

```bash
npm ci
cp .env.example .env        # điền DATABASE_URL, JWT_SECRET (≥ 32 ký tự), CRON_SECRET, APP_URL
npx prisma migrate deploy   # tạo/cập nhật bảng (chỉ bổ sung, không xóa dữ liệu) – Supabase: dùng cổng 5432, xem docs/DEPLOYMENT.md
npm run dev                 # http://localhost:3000
```

**Triển khai production:** xem [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) (biến môi trường, migration, email, cron, Vercel, smoke test).

- Xin chuỗi kết nối DB qua kênh riêng của nhóm – **không** commit `.env` hay dán secret vào README/issue.
- Thiếu `JWT_SECRET` → server báo lỗi cấu hình (không có giá trị dự phòng).
- Quên mật khẩu: production cần `APP_URL` (link trong email) và `RESEND_API_KEY` + `MAIL_FROM` để gửi email.
  Ở môi trường dev chưa cấu hình email, email được lưu vào thư mục **`.mail/`** (mở file `.html` để bấm link).
- DB mới hoàn toàn: có thể chạy `database.sql` (sinh từ Prisma schema) hoặc `npx prisma migrate deploy`.
- Dữ liệu demo đầy đủ (**xóa toàn bộ dữ liệu cũ**, chỉ dùng cho DB demo riêng): `DEMO_RESET_CONFIRM=<host DB> npm run demo:reset`
  (từ chối khi `NODE_ENV=production` hoặc host nằm trong `PROTECTED_DATABASE_HOSTS`). Production không bao giờ tự seed.

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
| `npm test` | Unit/integration test (Vitest) cho logic tài chính, auth, phân quyền, IDOR, race condition |
| `npm run test:coverage` | Chạy test kèm báo cáo độ phủ (`coverage/index.html`) cho `src/lib` và `src/services` |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Nạp dữ liệu demo (cần `SEED_RESET=true`) |
| `npm run db:fix-categories` | Kiểm tra giao dịch có danh mục lệch loại thu/chi (dry-run); thêm `-- --apply` để sửa, có audit |
| `npm run demo:reset` | Đặt lại dữ liệu demo (nhiều lớp xác nhận, từ chối DB production) |
| `npm run cron:recurring` | Chạy scheduler giao dịch định kỳ một lần (giống cron), tự kiểm tra idempotent |

---

## 2. Tính năng

| Khu vực | Nội dung |
| --- | --- |
| **Tổng quan** | Số dư, thu/chi tháng (so với tháng trước), ngân sách còn lại, *Số tiền có thể chi*, *Dự kiến cuối tháng*, dòng tiền 7 ngày → 12 tháng, chi tiêu theo danh mục (click để lọc giao dịch), ngân sách, giao dịch gần đây, nhận định, mục tiêu; **mẹo tiết kiệm cá nhân hóa** xếp theo số tiền có thể tiết kiệm (ghim / bỏ qua) |
| **Giao dịch** | Tìm kiếm (debounce), lọc thu/chi, danh mục, khoảng ngày, khoảng tiền; sắp xếp; phân trang phía server; bảng (desktop) / thẻ (mobile); chi tiết, sửa, xóa có xác nhận; lưu vết kiểm toán |
| **Thêm giao dịch** | Toggle thu/chi, ô số tiền lớn, *Gợi ý danh mục* theo mô tả (user luôn đổi được), chọn danh mục bằng icon, lặp lại định kỳ; cảnh báo trùng lặp và khoản chi bất thường trước khi lưu |
| **Ngân sách** | Chọn tháng, tổng quan, thêm/sửa/xóa, sao chép từ tháng trước; cảnh báo ≥ 80% và khi vượt |
| **Định kỳ & chi phí cố định** | Tiền nhà, Netflix, trợ cấp… trạng thái Đang chạy / Tạm dừng / Đã hủy; scheduler tự ghi giao dịch khi đến hạn, **idempotent** |
| **Mục tiêu tiết kiệm** | Nạp / rút tiền (không rút quá số đã để dành), sửa, hoàn thành (tự hoàn thành khi đủ tiền), lưu trữ / khôi phục, số ngày còn lại, số tiền cần để dành mỗi tháng; mục tiêu đã có lịch sử không xóa được |
| **Báo cáo** | Tháng / quý / năm: tổng kết, xu hướng, danh mục, top chi tiêu, giao dịch lớn nhất, hiệu quả ngân sách; **xuất PDF** (font tiếng Việt, biểu đồ vector); **gửi tóm tắt qua email** tới chính tài khoản (chỉ hiện khi đã cấu hình Resend); **lịch sử nhận định** các tháng trước, đánh dấu để xem lại |
| **Nhập CSV** | Tải file mẫu; nhận cột tiếng Việt/tiếng Anh, ngày `YYYY-MM-DD`/`DD/MM/YYYY`, số tiền `45.000`/`-45000`; xem trước, gợi ý danh mục hàng loạt, sửa từng dòng, bỏ qua giao dịch trùng; tối đa 500 dòng |
| **Campus Points** | Điểm thưởng nội bộ (không phải tiền, không quy đổi): +10 giao dịch đầu tiên, +2 mỗi ngày có ghi chép, +5 để dành cho mục tiêu, +10 giữ ngân sách trọn tuần, +25 đạt tiết kiệm tháng, +25 hoàn thành mục tiêu; cấp độ, chuỗi ngày, thành tựu |
| **Song ngữ** | Tiếng Việt / English – nút VI/EN trên header, trang đăng nhập, landing và trong Cài đặt |
| **Thông báo** | Ngân sách, định kỳ, mục tiêu, chi tiêu bất thường, hệ thống; chống spam bằng `dedupe_key`; đánh dấu đã đọc |
| **Cài đặt** | Hồ sơ, giao diện sáng/tối + cỡ chữ, ngôn ngữ, thiết lập tài chính (trợ cấp, ngày nhận, tiết kiệm tháng – ảnh hưởng trực tiếp Số tiền có thể chi/dự báo), danh mục cá nhân (thêm/sửa/xóa), tùy chọn thông báo, đổi mật khẩu, đăng xuất mọi thiết bị khác. Tiền tệ (VND) và múi giờ (Việt Nam) cố định – chỉ hiển thị |
| **Quản trị** | Tổng quan hệ thống (người dùng hoạt động, tăng trưởng, khối lượng giao dịch, phân bổ danh mục, tình trạng DB), quản lý người dùng (tìm kiếm, vô hiệu hóa, phân quyền, đặt lại mật khẩu – bắt đổi khi đăng nhập, xuất CSV), danh mục mặc định (thêm/sửa/xóa), mẫu mẹo tiết kiệm, thông báo toàn hệ thống, nhật ký quản trị |

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
- Token phiên chứa dấu vân tay (SHA-256 cắt ngắn) của `password_hash`: đổi mật khẩu, admin đặt lại mật khẩu hoặc
  đặt lại qua email đều **đăng xuất mọi phiên cũ** ngay lập tức, không cần bảng lưu phiên.
- Quên mật khẩu: link có hiệu lực 30 phút, dùng một lần; phản hồi luôn giống nhau và email gửi sau khi phản hồi
  (không dò được email nào có tài khoản). Token đặt lại và token phiên dùng `audience` khác nhau.
- Admin đặt lại mật khẩu: sinh mật khẩu tạm ngẫu nhiên, chỉ hiển thị một lần cho admin.
- Rate limit đăng nhập theo IP + email và thêm một giới hạn riêng theo email (không bypass được bằng header IP giả).

### Giao dịch định kỳ

Scheduler chạy "lazy" khi người dùng mở app, và có endpoint cron `GET /api/cron/recurring`
(header `Authorization: Bearer $CRON_SECRET`). Mỗi lần chạy, tiến trình phải "giành" kỳ bằng một câu UPDATE có điều kiện
(`status = active` và `next_run_date` cũ) **trước** khi sinh giao dịch, trong cùng một DB transaction; unique `(recurring_id, date)`
là lớp bảo vệ thứ hai. Nhờ vậy chạy lặp, chạy song song, hay lịch vừa bị tạm dừng giữa chừng đều không sinh giao dịch trùng.

- Ngày bắt đầu trong quá khứ: chỉ ghi bù các kỳ của **tháng hiện tại** (không sinh hàng loạt giao dịch cho nhiều năm trước).
- Kích hoạt lại lịch đã tạm dừng **hoặc đã hủy**: bỏ qua các kỳ đã lỡ, chạy tiếp từ kỳ kế tiếp.
- Cron bỏ qua tài khoản đã bị vô hiệu hóa.

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
- Trước khi push: `npm run lint && npm run typecheck && npm test && npm run test:coverage && npm run build`.

---

## 5. Nhật ký thay đổi

### Hoàn thiện sản phẩm (triển khai được)

- **Thiết lập nhanh sau đăng ký** (`/onboarding`): trợ cấp tháng, ngày nhận, tiết kiệm tháng, tùy chọn tự ghi khoản trợ cấp
  (khoản thu định kỳ từ lần nhận kế tiếp) và ngân sách khởi đầu gợi ý theo thu nhập; có thể bỏ qua. Đổi trợ cấp/ngày nhận trong
  Cài đặt → khoản thu định kỳ liên kết tự cập nhật.
- **Mục tiêu tiết kiệm** bật lại đầy đủ; thêm **Lưu trữ / Khôi phục**; mục tiêu đã có lịch sử nạp/rút không xóa được (phải lưu trữ).
- **Điều hướng mobile:** Tổng quan · Giao dịch · **+** · Ngân sách · Mục tiêu; các trang khác trong menu ở header.
- **Bảo mật tài khoản:** "Đăng xuất khỏi mọi thiết bị khác" (Cài đặt → Bảo mật); thông báo bảo mật khi đổi/đặt lại mật khẩu.
- **Tài khoản mới không có dữ liệu:** thẻ "có thể chi" và dự báo hiển thị hướng dẫn thay vì con số 0 / cảnh báo thiếu hụt giả.
- **Dự báo cuối tháng:** mức tin cậy (thấp / trung bình / cao) và "Dựa trên N ngày dữ liệu"; dưới 3 ngày không hiện con số.
- **Email:** khung HTML responsive + bản chữ thuần; dev lưu vào `.mail/`; production từ chối link localhost/không https; không log token.
- **Cron thật:** `vercel.json` chạy `/api/cron/recurring` 00:05 giờ VN mỗi ngày; một lịch lỗi không chặn lịch khác; log có cấu trúc.
- **Hoàn thiện tính năng còn dở:** mẹo tiết kiệm cá nhân hóa + mẫu mẹo của admin (bảng `saving_tips` trước đây chưa dùng),
  lịch sử nhận định theo tháng + đánh dấu (bảng `insights`), sửa danh mục (cá nhân và hệ thống), gửi báo cáo qua email,
  trang quên mật khẩu báo rõ khi hệ thống chưa bật email thay vì "đã gửi".
- **Hạ tầng:** header bảo mật (CSP, HSTS, X-Frame-Options…), kiểm tra Origin cho request ghi dữ liệu, `GET /api/health`,
  `robots.txt` + `sitemap.xml`, CI GitHub Actions, timeout 30 giây cho request, chống gửi trùng ở form tài chính.

### Rà soát cuối (bảo mật, dữ liệu, kế hoạch chi tiêu)

- **Cần chạy migration** `20260929000000_admin_audit_constraints` (chỉ bổ sung: bảng `admin_audits` + ràng buộc CHECK dạng
  `NOT VALID`, không đụng dữ liệu cũ). Với Supabase, dùng chuỗi kết nối **trực tiếp cổng 5432** (pooler 6543 không chạy được migrate):
  `DATABASE_URL="<chuỗi 5432>" npx prisma migrate deploy`. Trước khi chạy, app vẫn hoạt động (nhật ký quản trị tạm bỏ qua).
- **Mật khẩu tạm bắt buộc đổi**: admin đặt lại mật khẩu → lần đăng nhập sau phải đặt mật khẩu mới ở `/change-password`
  (mọi API khác trả 403 `PASSWORD_CHANGE_REQUIRED`).
- **Nhật ký quản trị** (Quản trị → Hệ thống): khóa/mở, đổi quyền, đặt lại mật khẩu, danh mục hệ thống, thông báo, xuất CSV.
- **API GET chỉ đọc**: sinh giao dịch định kỳ và cộng điểm theo kỳ chuyển sang `POST /api/sync` (app gọi khi mở);
  cron `/api/cron/recurring` vẫn giữ nguyên.
- **Giao dịch định kỳ** được ghi lưu vết kiểm toán như giao dịch nhập tay.
- **Kế hoạch chi tiêu**: trợ cấp tháng + ngày nhận trong Cài đặt được tính là thu nhập sắp nhận (nếu chưa có khoản thu định kỳ);
  tốc độ chi/ngày và trung bình lịch sử chia cho **số ngày thực sự có dữ liệu** (user mới không bị đánh giá thấp).
- **Mục tiêu**: chỉ nạp/rút khi đang thực hiện; đạt đủ tiền tự chuyển "hoàn thành"; mục tiêu lưu trữ phải mở lại trước khi hoàn thành.
- **Danh mục** đang có ngân sách không xóa/đổi loại được (trước đây xóa danh mục hệ thống sẽ xóa ngân sách của mọi user).
- **CSV xuất người dùng** chống formula injection (`=`, `+`, `-`, `@` ở đầu ô).
- **Rate limit** dùng Upstash Redis nếu có `UPSTASH_REDIS_REST_URL`/`TOKEN` (chung cho mọi instance), tự lùi về bộ nhớ khi không có/lỗi.

### Responsive toàn diện (desktop lớn → điện thoại)

- **Hệ layout chung** (`src/app/globals.css`): token `--page-gutter`/`--page-max` (1480px) tăng dần theo màn hình, utility
  `container-page`, `container-text`, `section-space`, `app-page`; component `Container`/`Section` (`src/components/layout/container.tsx`).
  Bỏ các `max-w-7xl` rải rác – navbar, hero và mọi section thẳng hàng trên cùng một lưới. Breakpoint thêm `xs` 390 và `3xl` 1600.
- **Hero**: 2 cột từ 1024px (40/60 → ~42/58 từ 1280), tiêu đề `clamp()` tối đa 76px, mockup lớn tới 820px ở màn hình rộng,
  chiều cao khung đầu được kẹp để 1366×768 vừa một màn. Mockup dùng container query (không `transform: scale`);
  điện thoại có **mockup riêng dạng app** (`hero-mobile-dashboard.tsx`).
- **App shell**: < 768px header mobile (tên trang) + thanh điều hướng dưới *Tổng quan · Giao dịch · + · Ngân sách · Thêm*;
  768–1279 rail chỉ icon; ≥ 1280 sidebar 248px. Hỗ trợ safe-area iPhone (`viewport-fit=cover`).
- **Dashboard**: một lưới – điện thoại xếp theo mức ưu tiên (số dư → có thể chi → ghi nhanh → ngân sách → gần đây…),
  laptop 2 cột, ≥ 1440px lưới 12 cột. Thẻ số liệu, biểu đồ tròn, dòng ngân sách tự co theo chiều rộng thẻ (container query).
- **Form mobile**: ô nhập 16px (không bị iOS tự phóng to) và cao 44px; bảng giao dịch chỉ từ 1024px, nhỏ hơn dùng danh sách thẻ.
- Bỏ `overflow-x: hidden` trên `body`; sửa các nguồn tràn ngang thật (tooltip biểu đồ landing, bảng thông báo trên điện thoại).

### Rà soát bảo mật & tính đúng đắn

- **Quên mật khẩu / đặt lại mật khẩu** (`/forgot-password`, `/reset-password`) và **admin đặt lại mật khẩu** (nút chìa khóa ở Quản lý người dùng) – SRS 3.1 / 3.11.
- Đổi mật khẩu đăng xuất các thiết bị khác. **Sau khi triển khai bản này, mọi người dùng cần đăng nhập lại một lần** (định dạng token mới).
- Sửa vòng lặp chuyển hướng khi token còn chữ ký hợp lệ nhưng tài khoản đã bị khóa/xóa/đổi mật khẩu.
- Mục tiêu: nạp/rút dùng một câu UPDATE có điều kiện (hai lần rút song song không thể làm số dư âm); không nạp/rút mục tiêu đã lưu trữ;
  bấm "Hoàn thành" khi chưa đủ tiền không được cộng điểm; +5 điểm nạp mục tiêu tối đa một lần mỗi ngày.
- Gợi ý danh mục theo lịch sử: sửa lỗi tách từ (`/s+/` → `/\s+/`) khiến gợi ý sai với mô tả có chữ "s".
- Số tiền tối đa 9.999.999.999 và tối đa 2 chữ số thập phân (khớp cột `Decimal(12, 2)`); ngày trong khoảng năm 2000–2100.
- Bộ lọc giao dịch bị đảo (từ ngày > đến ngày, min > max) được tự hoán đổi.
- Lỗi Prisma P2025 → 404, P2003 → 409 thay vì 500. Danh mục gợi ý do client gửi chỉ được lưu nếu user có quyền dùng.
- Thông báo hệ thống: bấm gửi lặp lại cùng nội dung trong 10 phút không gửi trùng.
- `db:seed` từ chối chạy khi `NODE_ENV=production` nếu không có thêm `SEED_ALLOW_PRODUCTION=true`, và in ra DB đích trước khi xóa.
- Không đổi schema/migration.

### Giao diện trang chủ (landing) – thiết kế lại

- Trang chủ chia thành các section rõ ràng: Hero có mockup dashboard, Vấn đề, "Có thể chi hôm nay" (kèm bảng
  giải thích cách tính), Ngân sách, Dòng tiền (chọn 3/6/12 tháng), Mục tiêu, Bảo mật (nền tối), CTA cuối và footer nhiều cột.
- Thanh điều hướng mới: trong suốt ở đầu trang, mờ nền khi cuộn, có liên kết tới từng section và menu dạng sheet trên mobile.
- Component nằm trong `src/components/landing` (mockup ở `landing/dashboard`); dữ liệu mẫu gom tại
  `src/data/demo-finance.ts` và luôn gắn nhãn "Dữ liệu mẫu".
- Sitemap trực quan vẫn giữ trên trang chủ theo yêu cầu SRS.
- Nội dung section Bảo mật chỉ nêu những gì hệ thống thực sự làm: không liên kết ngân hàng, dữ liệu tách theo tài khoản,
  mật khẩu băm một chiều, cookie httpOnly, giới hạn số lần đăng nhập.
- Thêm favicon SVG, metadata SEO/OpenGraph theo ngôn ngữ, nút cỡ `xl` cho CTA.
- Hiệu ứng nhẹ (xuất hiện tuần tự, thanh tiến độ, cột biểu đồ); tự tắt khi người dùng bật "giảm chuyển động".
- Đã kiểm tra hiển thị ở 1440 / 1366 / 1024 / 768 / 430 / 390 / 375px, cả chế độ sáng và tối, không cuộn ngang.

### Màu chủ đạo: đổi từ xanh lá (emerald) sang teal `#2dd4bf`

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--primary` | `#2dd4bf` | `#2dd4bf` | Nền nút chính, CTA, logo, thanh tiến độ |
| `--primary-hover` | `#14b8a6` | `#5eead4` | Trạng thái hover của nút |
| `--primary-foreground` | `#042f2e` | `#042f2e` | Chữ trên nền teal |
| `--primary-ink` *(mới)* | `#0f766e` | `#2dd4bf` | Chữ, icon, viền màu nhấn trên nền sáng/tối |
| `--primary-soft` | `#f0fdfa` | `#0d2b28` | Nền nhạt (thẻ chọn, badge) |
| `--brand` / `--brand-bright` | `#14b8a6` / `#2dd4bf` | `#2dd4bf` / `#5eead4` | Điểm nhấn, biểu đồ nhỏ, vầng sáng hero |
| `--success` | `#0f766e` | `#2dd4bf` | Thu nhập, trạng thái tốt |
| `--ring` | `#0d9488` | `#5eead4` | Viền focus bàn phím |

- **Vì sao nút dùng chữ tối thay vì chữ trắng:** chữ trắng trên `#2dd4bf` chỉ đạt tỉ lệ tương phản ~1.9:1 (không đạt WCAG);
  chữ `#042f2e` đạt ~10:1.
- **Vì sao tách `--primary-ink`:** `#2dd4bf` quá nhạt để làm chữ trên nền trắng, nên mọi `text-primary` / `border-primary`
  được đổi sang `text-primary-ink` / `border-primary-ink` (`#0f766e`, ~5.5:1). Ở chế độ tối, `--primary-ink` chính là `#2dd4bf`.
- Các chấm "chưa đọc" của thông báo và vạch đánh dấu mục đang chọn ở sidebar dùng `bg-primary-ink` để dễ nhìn.
- Logo, favicon (`src/app/icon.svg`) và logo trong file PDF xuất báo cáo (`src/lib/report-pdf.ts`) đổi sang nền teal, chữ C màu tối.
- Màu biểu đồ Thu/Chi, màu cảnh báo (đỏ/vàng) giữ nguyên vì đã được kiểm định cho người mù màu.
- Nguồn sự thật của mọi màu: `src/app/globals.css` (xem thêm `DESIGN.md`).

### Hài hòa màu sắc & căn chỉnh giao diện

- **Màu trung tính ngả teal:** nền, chữ, viền đổi từ xám ngả xanh lá (còn sót từ bảng emerald) sang xám ngả teal để
  đồng bộ với màu chủ đạo.

  | Token | Sáng | Tối |
  | --- | --- | --- |
  | `--background` | `#f7fafa` | `#081110` |
  | `--surface` / `--surface-secondary` | `#ffffff` / `#f1f6f6` | `#0c1817` / `#122120` |
  | `--foreground` / `--muted` / `--subtle` | `#0b1716` / `#56686a` / `#647677` | `#eef6f5` / `#9eb2b1` / `#8a9e9d` |
  | `--border` | `rgb(12 45 43 / .09)` | `rgb(255 255 255 / .08)` |
  | `--inverse` (section Bảo mật) | `#08201e` | `#050d0c` |

- **Màu tô thanh tiến độ mới** `--warning-fill` (`#f59e0b`) và `--danger-fill` (`#e5484d`): thanh "sắp chạm ngân sách"
  trước đây dùng màu chữ cảnh báo `#b45309` nên trông nâu; nay thanh dùng màu tô sáng, còn chữ vẫn giữ màu đậm để đủ tương phản.
- **Thanh tiến độ bình thường** dùng `--brand` (`#14b8a6`) thống nhất giữa trang chủ và ứng dụng.
- **Bảng màu danh mục (biểu đồ tròn, PDF):** thay 2 màu xanh lá cũ bằng teal `#0f9f94` và xanh ô liu `#4d7c0f`
  (tối: `#14a399`, `#5f9a12`); đã chạy kiểm định cho người mù màu ở cả hai chế độ.
- **Khối CTA cuối trang:** bỏ mảng teal đặc chói mắt, thay bằng nền teal nhạt có quầng sáng nhẹ, chữ tối và nút chính teal.
- **Dashboard:** bỏ nút "Thêm giao dịch" bị trùng (đã có trên thanh trên cùng; mobile có nút tròn ở thanh dưới),
  sửa khoảng cách giữa tiêu đề và hàng thẻ số liệu (trước đó `mb-0` ghi đè `space-y-6` của Tailwind 4).
- Màu chữ/đường kẻ trong file PDF báo cáo cập nhật theo bảng trung tính mới.
