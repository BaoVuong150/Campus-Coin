# Triển khai Campus Coin

Hướng dẫn triển khai production (khuyến nghị: **Vercel + Supabase PostgreSQL**). Làm theo thứ tự.

---

## 1. Biến môi trường

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `DATABASE_URL` | ✔ | Chuỗi kết nối PostgreSQL cho **ứng dụng**. Supabase: dùng *Transaction pooler* cổng **6543** kèm `?pgbouncer=true`. |
| `JWT_SECRET` | ✔ | Khóa ký phiên, **≥ 32 ký tự ngẫu nhiên**. Tạo: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Đổi khóa = mọi người phải đăng nhập lại. |
| `CRON_SECRET` | ✔ | Bảo vệ `/api/cron/recurring`. Vercel Cron tự gửi `Authorization: Bearer $CRON_SECRET`. |
| `APP_URL` | ✔ | URL công khai **https** (ví dụ `https://campuscoin.vercel.app`). Dùng cho link đặt lại mật khẩu, sitemap, OpenGraph. Production từ chối gửi link nếu thiếu, không phải https hoặc là localhost. |
| `RESEND_API_KEY` | Khuyến nghị | Gửi email đặt lại mật khẩu qua [Resend](https://resend.com). Thiếu → chức năng quên mật khẩu **không gửi email** (có log `mail.not_configured`). |
| `MAIL_FROM` | Cùng Resend | Người gửi, ví dụ `Campus Coin <no-reply@your-domain.com>` (domain đã xác minh trên Resend). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Khuyến nghị | Rate limit dùng chung giữa các instance serverless. Thiếu → đếm trong bộ nhớ từng instance (vẫn chạy, kém hiệu quả hơn). |

Không bao giờ commit `.env`. Không dán secret vào README, issue hay chat nhóm công khai.

---

## 2. Database & migration

1. Tạo project Supabase (hoặc PostgreSQL ≥ 13).
2. Chạy migration bằng kết nối **hỗ trợ schema engine** – *Session pooler* (cổng **5432** trên host pooler) hoặc kết nối trực tiếp.
   Transaction pooler 6543 **không** chạy được migrate.

   ```bash
   DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" npx prisma migrate deploy
   DATABASE_URL="…:5432/postgres" npx prisma migrate status   # phải báo "Database schema is up to date"
   ```

3. Các migration đều **chỉ bổ sung** (không xóa cột/bảng). Migration `20260929000000_admin_audit_constraints` thêm bảng
   `admin_audits` và ràng buộc `CHECK … NOT VALID` (áp dụng cho dữ liệu mới, không quét/không từ chối dữ liệu cũ). Có thể kiểm tra
   dữ liệu cũ rồi `ALTER TABLE … VALIDATE CONSTRAINT …` sau.
4. DB mới hoàn toàn có thể dùng `database.sql` thay cho migrate (đã gồm dữ liệu mặc định và 2 tài khoản demo).

**Không bao giờ** chạy `prisma db push` hoặc `db:seed` trên production.

---

## 3. Tài khoản quản trị đầu tiên

Production không tự seed tài khoản. Cách tạo admin đầu tiên:

1. Đăng ký một tài khoản bình thường trên trang `/register`.
2. Trong Supabase SQL Editor:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'you@your-domain.com';
   ```
3. Đăng xuất / đăng nhập lại ở `/admin/login`. Từ đây quản lý quyền các tài khoản khác trong trang Quản trị (có nhật ký).

---

## 4. Email (quên mật khẩu)

- Resend: tạo API key, xác minh domain gửi, đặt `RESEND_API_KEY` và `MAIL_FROM`.
- Link trong email = `APP_URL/reset-password?token=…`, hiệu lực **30 phút**, **dùng một lần**; đổi mật khẩu xong mọi phiên cũ bị hủy.
- Email có bản HTML (hiển thị tốt trên điện thoại) và bản chữ thuần.
- Token không bao giờ được ghi vào log.
- Môi trường dev chưa cấu hình Resend: email được lưu vào thư mục `.mail/` (mở file `.html`, bấm link).

---

## 5. Cron – giao dịch định kỳ

`vercel.json` khai báo cron chạy **mỗi ngày 17:05 UTC (00:05 giờ Việt Nam)**:

```json
{ "crons": [{ "path": "/api/cron/recurring", "schedule": "5 17 * * *" }] }
```

- Chỉ chạy khi có `CRON_SECRET` (thiếu/sai → 401, có log `cron.unauthorized`).
- Idempotent: chạy lặp/song song không sinh giao dịch trùng (mỗi kỳ được "giành" bằng UPDATE có điều kiện + unique `(recurring_id, date)`).
- Một lịch lỗi không chặn các lịch khác; kết quả ghi log `cron.recurring.completed` (`processed`, `created`, `failed`).
- Ngoài cron, app cũng đồng bộ khi người dùng mở app (`POST /api/sync`).
- Nền tảng không có cron: dùng dịch vụ gọi URL theo lịch (GitHub Actions schedule, cron-job.org…) với header
  `Authorization: Bearer <CRON_SECRET>`, hoặc chạy tay `npm run cron:recurring`.

---

## 6. Triển khai lên Vercel

1. Import repository, framework **Next.js**, Node **22**.
2. Khai báo biến môi trường ở mục 1 cho *Production* (và *Preview* nếu cần – dùng DB riêng cho preview).
3. Build mặc định (`npm run build`; `postinstall` chạy `prisma generate`).
4. Chạy migration (mục 2) **trước** khi chuyển traffic sang bản mới.
5. Kiểm tra tab *Cron Jobs* của project có job `/api/cron/recurring`.

---

## 7. Bảo mật đã bật sẵn

- Header: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production);
  API trả `Cache-Control: no-store`.
- Cookie phiên `httpOnly`, `SameSite=Lax`, `Secure` (production); request ghi dữ liệu từ origin khác bị từ chối (403).
- Phiên gắn với mật khẩu: đổi/đặt lại mật khẩu hoặc "Đăng xuất mọi thiết bị" → mọi phiên cũ hết hiệu lực.
- Admin đặt lại mật khẩu → người dùng bắt buộc đổi mật khẩu ở lần đăng nhập sau; mọi thao tác quản trị có nhật ký.
- Rate limit đăng nhập / đăng ký / quên mật khẩu / nhập CSV; xuất CSV chống formula injection.
- Trang trong app, admin, API: `noindex` và bị chặn trong `robots.txt`.

---

## 8. Giám sát

- **Health check:** `GET /api/health` → `200 {"status":"ok","database":"ok"}`; DB lỗi → `503`. Gắn vào dịch vụ uptime (UptimeRobot, Better Stack…).
- **Log có cấu trúc** (một dòng JSON, tìm theo `event`): `api.unexpected_error`, `auth.login_rate_limited`, `mail.failed`,
  `mail.not_configured`, `mail.unsafe_base_url`, `cron.recurring.completed`, `cron.recurring.failed`, `cron.unauthorized`,
  `recurring.item_failed`. Không chứa mật khẩu, token hay số tiền.

---

## 9. Kiểm tra sau triển khai (smoke test)

Làm trên bản production, ghi lại kết quả:

| # | Bước | Kỳ vọng |
| --- | --- | --- |
| 1 | Mở `/` | Landing hiển thị, không lỗi console; `/robots.txt`, `/sitemap.xml` trả về |
| 2 | `GET /api/health` | `200`, `database: ok` |
| 3 | Đăng ký tài khoản mới | Chuyển tới **Thiết lập nhanh** → nhập trợ cấp, ngày nhận → Dashboard |
| 4 | Dashboard tài khoản mới | Không có NaN/undefined; thẻ "có thể chi" hiện hướng dẫn thêm giao dịch |
| 5 | Thêm giao dịch chi | Số dư, chi tiêu tháng, ngân sách cập nhật |
| 6 | Tạo ngân sách, chi tới ≥ 80% | Thông báo cảnh báo (chỉ một lần) |
| 7 | Mục tiêu: nạp tiền | Tiến độ cập nhật; rút quá số dư bị từ chối |
| 8 | Định kỳ: tạo / tạm dừng / tiếp tục | Trạng thái đổi đúng |
| 9 | Báo cáo tháng → Xuất PDF | File PDF tải về, tiếng Việt đúng |
| 10 | Quên mật khẩu | Email tới; link đổi được mật khẩu; dùng lại link bị từ chối; mật khẩu cũ không đăng nhập được |
| 11 | Admin: đặt lại mật khẩu cho SV | Mật khẩu tạm hiện một lần; SV đăng nhập → bắt buộc đổi mật khẩu |
| 12 | SV mở `/admin` | Bị chuyển hướng; `GET /api/admin/users` → `403` |
| 13 | `GET /api/cron/recurring` không header | `401` |
| 14 | Điện thoại (≤ 430px) | Thanh điều hướng dưới, form dạng bottom sheet, không cuộn ngang |
| 15 | Log nền tảng | Không có `api.unexpected_error` bất thường |
