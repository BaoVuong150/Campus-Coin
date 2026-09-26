# CAMPUS COIN - SMART SPENDING STUDENT STYLE
> **Dự án dự thi Cuộc thi World Tech Championship (Aptech) - TECHWIZ 7**  
> **Chủ đề (Theme):** NextGen BudgetBee  
> **Hạng mục (Category):** End-to-End Web Solutions  
> **Phiên bản SRS:** 1.0 (Student-First Smart Financial Web Solution)  
> **Công nghệ chủ đạo:** Next.js 16 (App Router, Turbopack, React 19, TypeScript), Tailwind CSS 4, Prisma ORM, PostgreSQL (Supabase Cloud), Recharts, Web Crypto API.

---

## 📌 DÀNH CHO BẠN VÀ AI ASSISTANT LÀM CHUNG DỰ ÁN (PROJECT BRIEFING FOR TEAM & AI)

> 💡 **Lưu ý đặc biệt cho AI Assistant (Cursor / Windsurf / Claude Code / Antigravity / Copilot):**  
> Dự án này đang chạy **Next.js 16 (Turbopack) & React 19**. Vui lòng đọc kỹ toàn bộ tài liệu này trước khi chỉnh sửa mã nguồn để nắm vững toàn bộ kiến trúc, tiến độ đã làm và các **nguyên tắc bắt buộc không được vi phạm**.

---

## 1. 🚀 HƯỚNG DẪN BẮT ĐẦU NHANH TRONG 1 PHÚT (1-MINUTE QUICKSTART)

Dự án đã được cấu hình tự động hóa toàn diện, bạn chỉ cần thực hiện 4 bước sau để khởi chạy ngay:

### Bước 1: Clone dự án & di chuyển vào thư mục
```bash
git clone <URL_GITHUB_CUA_NHOM>
cd Techwiz-7
```

### Bước 2: Cài đặt thư viện (Dependencies)
```bash
npm install
```
*(Hệ thống đã cấu hình script `postinstall: "prisma generate"`, Prisma Client sẽ tự động sinh mã kết nối ngay khi lệnh `npm install` kết thúc mà không cần gõ thêm lệnh nào).*

### Bước 3: Cấu hình biến môi trường (`.env`)
Tạo một file `.env` tại thư mục gốc của dự án và dán chuỗi kết nối Database dùng chung của nhóm:
```env
DATABASE_URL="postgresql://postgres:0932764541Asd@db.qgwzbldfjjcufjuadlzq.supabase.co:5432/postgres"
JWT_SECRET="campuscoin_techwiz7_secret_key_2026"
```
> 🌟 **Lợi thế:** Dự án sử dụng cơ sở dữ liệu đám mây **Supabase PostgreSQL**, bạn **KHÔNG CẦN cài đặt PostgreSQL trên máy tính**. Cả nhóm dùng chung một database thực tế đã có sẵn đầy đủ 6 tháng giao dịch, ngân sách và người dùng!

### Bước 4: Khởi chạy Dev Server
```bash
npm run dev
```
Mở trình duyệt truy cập: **`http://localhost:3000`** — Ứng dụng sẽ hoạt động ngay lập tức!

---

## 2. 📋 TIẾN TRÌNH & NHỮNG GÌ ĐÃ HOÀN THIỆN (WHAT HAS BEEN DONE)

Dự án đã được hoàn thiện toàn bộ các yêu cầu chức năng nghiệp vụ từ SRS 3.1 đến SRS 3.12:

### 2.1. Xác thực & Quản lý người dùng (Authentication & Session Guard)
- **Đăng ký sinh viên (`/register`):** Tạo hồ sơ sinh viên với mức trợ cấp cơ bản (`monthly_allowance_baseline`) và mục tiêu tiết kiệm hàng tháng (`monthly_savings_goal`).
- **Đăng nhập sinh viên (`/login`):** Xác thực mật khẩu mã hóa qua `bcryptjs`, sinh mã JWT lưu trong cookie an toàn `campuscoin_token` (httpOnly, sameSite lax, 7 ngày).
- **Cổng Quản trị viên riêng biệt (`/admin/login`, `/admin`):** Đăng nhập Admin tách biệt độc lập với sinh viên (SRS 3.1 Direct-Access Admin).
- **Navbar Dynamic Auth State:** Tự động phát hiện phiên đăng nhập qua `/api/user/profile`:
  - Chưa đăng nhập: Hiển thị nút "Đăng nhập".
  - Đã đăng nhập: Tự động ẩn nút đăng nhập, hiển thị Avatar, Tên sinh viên (ví dụ: Vương Gia Bảo), nút truy cập "Vào Sổ Chi Tiêu" và nút "Đăng xuất".
- **Bảo vệ 2 lớp chống quay lại Login/Register khi đã đăng nhập:**
  - *Lớp 1 (Server-side):* Dùng Next.js 16 Edge Proxy (`src/proxy.ts`), chặn HTTP 307 Redirect thẳng về `/dashboard` (hoặc `/admin`) trước khi HTML kịp gửi về trình duyệt.
  - *Lớp 2 (Client-side):* Hook `useEffect` kiểm tra auth tại trang `/login`, `/register`, `/admin/login` chuyển hướng ngay lập tức, không để lộ form đăng nhập.

### 2.2. Sổ Chi Tiêu Toàn Diện All-in-One (`/dashboard`)
- **Dữ liệu thật 100% (No Hardcode):** Toàn bộ dữ liệu số dư, thu nhập, chi phí, ngân sách và lịch sử đều được nạp và tính toán trực tiếp từ Supabase Database.
- **Thanh ghi nhanh 5 giây:** Nhập số tiền + mô tả -> AI tự nhận diện và điền danh mục ngay trong 5 giây mà không cần mở modal phức tạp.
- **Thuật toán Hạn mức chi tiêu an toàn hôm nay (Daily Safe Spending):**
  - Đã chuẩn hóa theo ngày thực tế trong tháng (`daysInMonth = 30 hoặc 31 ngày`).
  - Logic bảo vệ mục tiêu tiết kiệm:
    $$\text{Hạn mức ngày} = \frac{\text{Tổng trợ cấp/lương} - \text{Mục tiêu tiết kiệm tháng} - \text{Chi phí cố định (Tiền trọ, mạng...)}}{\text{Tổng số ngày trong tháng}}$$
    Giúp sinh viên biết chính xác mỗi ngày tiêu tối đa bao nhiêu thì cuối tháng sẽ để dành được đúng mục tiêu tiết kiệm đã đề ra.
- **5 Thẻ tài chính thông minh:** Số dư hiện tại, Tổng thu nhập tháng, Tổng chi tiêu tháng, Quỹ tiết kiệm tích lũy, và Hạn mức an toàn hôm nay (có nhãn cảnh báo trạng thái).
- **Canh gác ngân sách danh mục (Budget Goals & Real-time Progress Bar):** Đo lường mức độ tiêu thụ thực tế so với ngân sách đã đặt ra, đổi màu cảnh báo khi chạm 80% và báo động khi vượt ngưỡng.
- **Lịch sử giao dịch đa tầng:** Gom nhóm theo Ngày, Tháng, Năm; lọc theo danh mục, loại thu/chi; chỉnh sửa hoặc xóa giao dịch mượt mà.
- **Biểu đồ tài chính Recharts:** So sánh Thu vs Chi 6 tháng liên tiếp, phân bổ cơ cấu chi tiêu theo tỷ lệ phần trăm trực quan.
- **Báo cáo & Xuất PDF:** Tự động tổng hợp báo cáo tháng và cho phép xuất file PDF lưu trữ.

### 2.3. Trí tuệ nhân tạo (AI Engine)
- **Tự động gán danh mục qua NLP (`/api/ai/categorize`):**
  - Tự động nhận diện ngữ nghĩa tiếng Việt: từ khóa ẩm thực (cơm, bún, cafe, trà sữa...) $\rightarrow$ Danh mục `Ăn uống`; từ khóa đi lại (xăng, grab, xe bus...) $\rightarrow$ `Đi lại`; nhà trọ/điện nước $\rightarrow$ `Tiền trọ / KTX`, v.v.
  - Tự động học từ lịch sử người dùng: Nếu sinh viên từng sửa danh mục cho một mô tả nào đó, lần sau AI sẽ ưu tiên thói quen của sinh viên đó trước.
- **Báo cáo thấu hiểu chi tiêu AI Insights (`/api/ai/insights`):** Tự động phát hiện danh mục có mức tăng đột biến và đưa ra lời khuyên thực tế.
- **Mẹo tiết kiệm cá nhân hóa (Saving Tips):** Tính toán từ dữ liệu chi tiêu, cho phép sinh viên Ghim (Pin) hoặc Bỏ qua (Dismiss).

### 2.4. Việt Hóa & Thiết kế chuẩn Production (No Demo/Scaffold)
- **100% Tiếng Việt cho Danh mục:** Toàn bộ 12 danh mục hệ thống đã được đồng bộ chuẩn tiếng Việt ở cả Database, Seed Script, AI Engine và UI:
  - *Thu nhập:* `Trợ cấp gia đình`, `Việc làm thêm`, `Học bổng`, `Quà tặng / Thưởng`, `Thu nhập khác`.
  - *Chi tiêu:* `Ăn uống`, `Đi lại`, `Tiền trọ / KTX`, `Học tập`, `Dịch vụ số`, `Giải trí`, `Chi tiêu khác`.
- **Dọn dẹp hoàn toàn giao diện bài tập/demo:**
  - Đã xóa khối tài khoản mẫu trên Trang chủ và Navbar.
  - Đã xóa các banner "Dành cho Ban giám khảo", "1-Click Login" trên trang đăng nhập để giao diện mang đúng dáng dấp của sản phẩm thương mại hoàn chỉnh.
  - Đã gỡ bỏ tính năng nhập CSV rườm rà.
- **Trợ năng & Giao diện hiện đại (Modern Fintech Aesthetics):** Hỗ trợ Dark/Light mode, điều chỉnh cỡ chữ (A / A+ / A++), hiệu ứng chuyển động tinh tế, chuẩn Responsive từ Mobile đến Desktop.

---

## 3. ⚠️ NGUYÊN TẮC BẮT BUỘC KHI DÙNG AI CODING (CRITICAL AI RULES)

Các thành viên và AI Assistant **BẮT BUỘC PHẢI TUÂN THỦ NGHIÊM NGẶT** các quy tắc sau (đã ghi nhận trong file `AGENTS.md`):

1. **CẤM CHẠY LỆNH `npm run dev` BẰNG TOOL CHẠY LỆNH CỦA AI:**
   - AI **tuyệt đối không được tự ý chạy `npm run dev`** hoặc bất kỳ lệnh daemon nào chiếm terminal. Lệnh này để **người dùng tự chạy trên cửa sổ terminal riêng** để tránh xung đột port (`EADDRINUSE`) hoặc treo tiến trình.
   - AI chỉ được phép chạy các lệnh một lần như: `npm run build`, `npx prisma db push`, `npx prisma db seed`.

2. **CẤM DÙNG `alert()`, `confirm()`, `prompt()` MẶC ĐỊNH CỦA TRÌNH DUYỆT:**
   - Tất cả thông báo, xác nhận hành động BẮT BUỘC sử dụng hook `const { toast } = useToast()` từ `@/context/ToastContext` và Modal Dialog của dự án.

3. **CẤM DÙNG VALIDATION TOOLTIP MẶC ĐỊNH CỦA TRÌNH DUYỆT:**
   - Tuyệt đối không để hiện bong bóng lỗi mặc định ("Please fill out this field"). Luôn thêm thuộc tính `noValidate` vào thẻ `<form noValidate ...>` và tự xử lý hiển thị lỗi tùy chỉnh.

4. **SINGLETON TOAST (CHỐNG TRÀN MÀN HÌNH):**
   - Hệ thống Toast được thiết kế chỉ hiển thị tối đa **DUY NHẤT 1 TOAST** tại bất kỳ thời điểm nào để tránh spam giao diện.

5. **QUY ƯỚC NEXT.JS 16 PROXY:**
   - Next.js 16 đã deprecate quy ước `middleware.ts` và thay bằng **`src/proxy.ts`**. Giữ nguyên cấu trúc này, không đổi ngược lại `middleware.ts`.

---

## 4. 📂 CẤU TRÚC THƯ MỤC TRỌNG YẾU (KEY PROJECT STRUCTURE)

```
Techwiz-7/
├── prisma/
│   ├── schema.prisma       # Cấu trúc CSDL (Users, Categories, Transactions, Budgets, Insights, SavingTips)
│   └── seed.ts             # Script nạp dữ liệu mẫu 6 tháng chuẩn Tiếng Việt
├── src/
│   ├── proxy.ts            # Proxy Next.js 16 (Bảo vệ route, chặn truy cập /login, /register khi đã auth)
│   ├── app/
│   │   ├── page.tsx        # Landing Page (Hero, AI demo showcase, Sitemap trực quan)
│   │   ├── layout.tsx      # Root Layout (Theme, Toast Provider, Font Inter)
│   │   ├── globals.css     # CSS toàn cục, Design tokens, dark mode, cursor pointer
│   │   ├── login/page.tsx  # Trang đăng nhập Sinh viên (Chuẩn production)
│   │   ├── register/page.tsx # Trang tạo hồ sơ Sinh viên
│   │   ├── dashboard/page.tsx # Trung tâm Sổ Chi Tiêu Sinh Viên All-in-One (Trọng tâm dự án)
│   │   ├── admin/
│   │   │   ├── page.tsx    # Bảng điều khiển Quản trị viên (Thống kê, danh mục trường)
│   │   │   └── login/page.tsx # Cổng đăng nhập Admin
│   │   └── api/            # Hệ thống RESTful API endpoints
│   │       ├── auth/       # Login, Register, Logout
│   │       ├── ai/         # /api/ai/categorize (NLP Rule Engine), /api/ai/insights
│   │       ├── transactions/ # Thao tác CRUD giao dịch
│   │       ├── categories/ # Quản lý danh mục
│   │       ├── budgets/    # Quản lý hạn mức ngân sách
│   │       ├── user/profile/ # Thông tin phiên làm việc người dùng hiện tại
│   │       └── admin/stats/ # Thống kê toàn hệ thống
│   ├── components/
│   │   ├── Navbar.tsx      # Thanh điều hướng thông minh (Tự nhận diện auth state, dark mode, font size)
│   │   └── SitemapSection.tsx # Sơ đồ hệ thống trực quan bắt buộc theo SRS
│   ├── context/
│   │   ├── ToastContext.tsx # Hệ thống Toast thông báo Singleton
│   │   └── ThemeContext.tsx # Quản lý Dark/Light mode & Font size trợ năng
│   └── lib/
│       ├── auth.ts         # JWT sign, verify & cookie helpers
│       ├── prisma.ts       # Singleton PrismaClient
│       └── currency.ts     # Format tiền tệ VNĐ và parser
├── .env.example            # Mẫu cấu hình môi trường
├── database.sql            # Script SQL thuần nộp bài cuộc thi
└── package.json            # Scripts & dependencies
```

---

## 5. 🔑 TÀI KHOẢN DÙNG THỬ SẴN CƠ SỞ DỮ LIỆU (TEST CREDENTIALS)

Khi khởi chạy thành công, bạn và giám khảo có thể dùng 2 tài khoản đã nạp sẵn dữ liệu thực tế sau:

| Loại tài khoản | Email đăng nhập | Mật khẩu | Phạm vi dữ liệu |
| :--- | :--- | :--- | :--- |
| **Sinh viên (Student)** | `student@campuscoin.edu` | `Student@123` | Nạp sẵn 6 tháng giao dịch, ngân sách tháng 9/2026, AI insights phân tích và mẹo tiết kiệm cá nhân. |
| **Quản trị viên (Admin)** | `admin@campuscoin.edu` | `Admin@123` | Toàn quyền Quản trị: Thống kê số lượng sinh viên toàn trường, thêm/xóa danh mục mặc định. |

---

## 6. 🛠️ CÁC LỆNH HỮU ÍCH KHI PHÁT TRIỂN
- `npm run dev`: Chạy dev server tại `http://localhost:3000`.
- `npm run build`: Kiểm tra biên dịch sản phẩm (Biên dịch 19/19 routes sạch 100%).
- `npm run db:push`: Đồng bộ schema từ `schema.prisma` lên PostgreSQL Supabase.
- `npm run db:seed`: Nạp lại toàn bộ dữ liệu mẫu ban đầu nếu cần làm mới.
