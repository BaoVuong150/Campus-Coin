<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CAMPUS COIN - PROJECT SPECIFICATION & SRS REQUIREMENTS (TECHWIZ 7)

> **Tài liệu tham chiếu:** [CampusCoin End-to-End Web Solutions_SRS.pdf](file:///c:/workplace/ASPdotNET/Techwiz-7/CampusCoin%20End-to-End%20Web%20Solutions_SRS.pdf)  
> **Cuộc thi:** Techwiz 7 - The World Tech Championship (Aptech)  
> **Chủ đề (Theme):** NextGen BudgetBee  
> **Hạng mục (Category):** End-to-End Web Solutions  
> **Phiên bản SRS:** 1.0  

---

## 1. TỔNG QUAN DỰ ÁN
**Campus Coin** là ứng dụng Web quản lý tài chính sinh viên thông minh ("Smart Spending Student Style") với định hướng "student-first":
- Dành riêng cho sinh viên cao đẳng/đại học quản lý các dòng tiền thu nhập không cố định (tiền trợ cấp gia đình, việc làm thêm, học bổng, tiền mừng/quà tặng...) và các chi phí sinh hoạt (căn tin, tiền trọ, giáo trình, xe cộ, gói dịch vụ số, giải trí...).
- **Không** liên kết tài khoản ngân hàng thực tế; dữ liệu nhập tay hoặc import CSV.
- Giao diện trực quan, responsive (Desktop, Tablet, Mobile).
- Tích hợp tính năng AI: Gợi ý phân loại danh mục tự động, sinh báo cáo phân tích thấu hiểu (Insights) và mẹo tiết kiệm thông minh.

---

## 2. KIẾN TRÚC HỆ THỐNG (3-Tier Architecture)
1. **Presentation Layer (Frontend):** Responsive Web UI (Dashboard, Entry Forms, Charts, Insights Feed, Notifications, Dark mode, Font size adjustment).
2. **Application / API Layer (Backend):** Xử lý Authentication, logic Thu/Chi, Recurring Transactions, Quản lý ngân sách, Phân tích dữ liệu & Báo cáo, Tích hợp AI/ML APIs.
3. **Data Layer (Database):** Hệ cơ sở dữ liệu quan hệ (PostgreSQL / SQL Server / MySQL) lưu trữ Users, Categories, Transactions, Budgets, Insights, Summaries.

---

## 3. CÁC PHÂN HỆ VÀ YÊU CẦU CHỨC NĂNG (Functional Requirements)

### 3.1. Xác thực & Quản lý Người dùng (User Authentication & Management)
- Đăng ký và đăng nhập dành cho Sinh viên.
- Cổng đăng nhập riêng biệt dành cho **Administrator** (Direct-access admin login).
- Quản lý phiên làm việc bảo mật (Secure session / JWT).
- Quên mật khẩu và đặt lại mật khẩu qua email tokenized link / xác thực email.
- Hồ sơ sinh viên (User Profile): Họ tên, năm học (academic year), mức trợ cấp cơ bản/tháng (monthly allowance baseline), mục tiêu tiết kiệm hàng tháng (monthly savings goal).
- Nhập dữ liệu giao dịch lịch sử hàng loạt từ file CSV (Bulk CSV import).

### 3.2. Quản lý Danh mục (Category Management)
- Danh mục Thu (Income Categories):
  - `Allowance` (Trợ cấp gia đình)
  - `Part-time Job` (Làm thêm)
  - `Scholarship` (Học bổng)
  - `Gift` (Quà tặng/Mừng)
  - `Other Income` (Thu nhập khác)
- Danh mục Chi (Expense Categories):
  - `Food` (Ăn uống, căn tin, giao hàng)
  - `Transport` (Đi lại, xe bus, xăng xe)
  - `Hostel/Rent` (Tiền trọ, ký túc xá)
  - `Academics` (Sách giáo trình, học phí, văn phòng phẩm)
  - `Subscriptions` (Dịch vụ trực tuyến: Netflix, Spotify, iCloud...)
  - `Entertainment` (Xem phim, dã ngoại, tụ tập)
  - `Miscellaneous` (Khác)
- Sinh viên có thể Thêm / Sửa / Xóa danh mục cá nhân hóa trong phần "Manage Own Categories".

### 3.3. Bảng điều khiển cá nhân hóa (Personalized Dashboard)
- Lời chào cá nhân theo tên sinh viên, số dư hiện tại trong tháng (Thu vs Chi).
- Nút thêm nhanh giao dịch (Quick-add buttons).
- Widget động: "Top Category của tháng", "Ngân sách so với Thực tế (Budget vs Actual)".
- Hiển thị danh sách các Mẹo tiết kiệm thông minh được cá nhân hóa.

### 3.4. Ghi chép Thu & Chi (Income & Expense Logging)
- Form nhập nhanh khoản Thu / Chi.
- Hỗ trợ **giao dịch định kỳ (Recurring entries)** (ví dụ: tiền trợ cấp nhận hàng tháng, phí đăng ký dịch vụ theo chu kỳ).
- Cho phép Chỉnh sửa và Xóa giao dịch nhưng vẫn lưu giữ lịch sử kiểm toán/dấu vết đầy đủ.

### 3.5. Trợ lý AI Phân loại Chi tiêu (AI-Driven Categorization)
- Tự động nhận diện và gợi ý danh mục khi sinh viên nhập mô tả (ví dụ gõ "Campus Cafe" -> AI gợi ý "Food").
- Học dần từ các lần sinh viên sửa lại phân loại để ngày càng chính xác hơn.
- Cho phép sinh viên ghi đè (manual override) gợi ý của AI.
- Hỗ trợ gợi ý phân loại hàng loạt khi import lịch sử từ file CSV.

### 3.6. Báo cáo & Thống kê hàng tháng (Monthly Reports)
- Báo cáo phân chia chi tiêu theo từng danh mục.
- Biểu đồ Thu vs Chi so sánh liên tục trong 6 tháng gần nhất.
- Báo cáo chi tiêu chi tiết theo ngày và theo tuần trong tháng hiện tại.
- Bộ lọc linh hoạt: Theo khoảng ngày (date range), danh mục (category), nguồn thu (income source).
- Xuất báo cáo ra định dạng **PDF** hoặc **Image** để sinh viên lưu trữ/in ấn.

### 3.7. AI Insights chi tiêu hàng tháng (AI-Generated Monthly Spending Insights)
- Tự động phân tích các giao dịch trong tháng để xuất ra đoạn văn bản tóm tắt tự nhiên, dễ hiểu.
- Cảnh báo các danh mục có mức tăng đột biến so với lịch sử (ví dụ: *"Food delivery spending rose 40% this month"*).
- Đưa ra lời khuyên thực tế, khả thi (ví dụ: đặt hạn mức trần theo tuần, gợi ý phương án tiết kiệm hơn).
- Lưu trữ lịch sử Insights các tháng trước để xem lại.

### 3.8. Động cơ gợi ý Tiết kiệm cá nhân hóa (Personalized Saving Tips Engine)
- Tính toán từ cơ sở dữ liệu dựa trên so sánh chi tiêu hiện tại với mức trung bình lịch sử và mục tiêu ngân sách.
- Xếp hạng mẹo tiết kiệm theo mức độ tác động tiềm năng (Potential savings impact) và hiển thị top mẹo lên dashboard.
- Cho phép sinh viên Ghim (Pin) mẹo hữu ích hoặc Bỏ qua (Dismiss).

### 3.9. Mục tiêu Ngân sách & Cảnh báo (Budget Goals & Alerts)
- Thiết lập hạn mức ngân sách tháng cho từng danh mục (ví dụ: Food: 50 USD/tháng).
- Thanh đo tiến độ (Progress bar) tiêu thụ ngân sách theo thời gian thực.
- Gửi thông báo trong ứng dụng (**In-app notification**) khi chi tiêu tiến sát hoặc vượt ngân sách.

### 3.10. Đánh dấu, Ghi chú & Chia sẻ (Bookmarking, Notes & Sharing)
- Bookmark mẹo tiết kiệm hoặc insight tháng để tra cứu sau.
- Xuất tóm tắt tiết kiệm hoặc báo cáo ra PDF hoặc gửi qua Email.

### 3.11. Bảng điều khiển Quản trị viên (Admin Control Panel)
- Thêm / Sửa / Xóa danh mục mặc định dùng chung cho toàn hệ thống.
- Quản lý thông báo hệ thống và các mẫu mẹo tiết kiệm (system-wide announcement & tip templates).
- Quản lý tài khoản sinh viên: Xem danh sách, Vô hiệu hóa (Disable), Đặt lại mật khẩu (Reset).
- Xem số liệu thống kê hệ thống: Số lượng user hoạt động (active users), tổng số giao dịch, các danh mục được dùng nhiều nhất.

### 3.12. Tính năng UX nâng cao & Trợ năng (Advanced UX & Accessibility)
- Lưu vết các giao dịch vừa xem hoặc vừa sửa gần nhất qua các session.
- Dự báo chi tiêu cho tháng kế tiếp dựa trên xu hướng lịch sử.
- Phát hiện và cảnh báo các giao dịch có số tiền bất thường (unusually large) hoặc giao dịch bị trùng lặp (duplicate).
- Tùy chỉnh chế độ Tối/Sáng (**Dark-mode toggle**) và điều chỉnh cỡ chữ (Font-size adjustment).
- Thanh điều hướng Breadcrumbs rõ ràng.
- Hiệu ứng chuyển động mượt mà và chỉ báo loading khi render biểu đồ hoặc AI insights.
- Chatbot hỗ trợ (Tawk.to, Tidio hoặc AI assistant bot).

---

## 4. MÔ HÌNH DỮ LIỆU THAM KHẢO (Database Entities)
- **User:** `user_id` (PK), `name`, `email` (Unique), `password_hash`, `academic_year`, `monthly_savings_goal`, `created_at`
- **Category:** `category_id` (PK), `name`, `type` ('income' | 'expense'), `is_default` (boolean)
- **Transaction:** `transaction_id` (PK), `user_id` (FK), `category_id` (FK), `amount`, `type`, `description`, `ai_suggested_category`, `date`, `created_at`
- **Budget:** `budget_id` (PK), `user_id` (FK), `category_id` (FK), `month`, `limit_amount`
- **Insight:** `insight_id` (PK), `user_id` (FK), `month`, `summary_text`, `tip_text`, `generated_at`

---

## 5. CÔNG NGHỆ CHÍNH XÁC CỦA DỰ ÁN
* **Framework:** Next.js (App Router, React, TypeScript).
* **Styling:** Tailwind CSS / CSS Modules (hỗ trợ Dark Mode, Responsive Mobile/Tablet/PC).
* **Database:** PostgreSQL (Supabase / Neon) kết nối qua Prisma ORM, có sẵn script `.sql`.
* **Charts:** Chart.js / Recharts.
* **AI Integration:** Google Gemini API / OpenAI API cho tính năng Auto-Categorization & Monthly Spending Insights.

---

## 6. SẢN PHẨM BÀN GIAO BẮT BUỘC (MANDATORY DELIVERABLES)
1. **File Báo cáo dự án (Project Report - KHÔNG chứa source code):**
   - Problem Definition
   - Design Specifications
   - Diagrams: Flowcharts, DFD, Architecture, ERD
   - Database Design
   - Test Data đã sử dụng
   - **Project Installation Instructions (BẮT BUỘC)**
   - **User Credentials cho tất cả loại tài khoản kèm Passwords (BẮT BUỘC)**
2. **Sitemap trực quan ngay trên trang chủ:** Bắt buộc thiết kế và gắn Sitemap lên Home page.
3. **Mã nguồn và Database:** File nộp `.zip` gồm mã nguồn, `ReadMe.doc` (ghi rõ các giả định nếu có) và file script tạo CSDL `.sql`.
4. **Video Demo (.mp4):** BẮT BUỘC có 1 video `.mp4` quay lại quá trình hoạt động thực tế đầy đủ các tính năng trong Functional Requirements.

---

## 7. NGUYÊN TẮC SỬ DỤNG AI (AI RULES)
- AI chỉ đóng vai trò hỗ trợ; không copy 100% template trang web làm sẵn.
- Thành viên phải hiểu và giải thích được toàn bộ code khi ban giám khảo vấn đáp.
- Phải khai báo danh sách các công cụ AI đã sử dụng trong tài liệu nộp bài.
- Không dùng AI để tạo tự động toàn bộ tài liệu dự án.

---

## 8. THANG ĐIỂM ĐÁNH GIÁ CHÍNH THỨC (EVALUATION PARAMETERS - 100 ĐIỂM)
> **Tài liệu tham chiếu:** [TechWiz 7-Evaluation Parameters.pdf](file:///c:/workplace/ASPdotNET/Techwiz-7/TechWiz%207-Evaluation%20Parameters.pdf) (Trang 4 & 5 - Hạng mục End-to-End Web Solutions)

| Tiêu chí (Parameter) | Điểm | Yêu cầu đánh giá chi tiết của Ban Giám Khảo |
| :--- | :---: | :--- |
| **1. Functionality Testing** | **35** | Kiểm tra độ hoàn thiện chức năng so với yêu cầu trong SRS. Đạt điểm cao nhất nếu thỏa mãn đầy đủ các nghiệp vụ được giao. |
| **2. UI and Accessibility Testing** | **15** | Giao diện thân thiện, điều hướng mượt mà, thành phần rõ ràng. Màu sắc & font chữ dễ đọc (Accessibility). **Kiểm tra responsive trên nhiều kích cỡ màn hình/thiết bị mô phỏng**. |
| **3. Source Code** | **10** | Công nghệ, phương pháp lập trình, cấu trúc thư mục chuẩn (images, css, controllers...). **Bắt buộc có chú thích code (commenting) phù hợp**. Tuân thủ coding conventions. |
| **4. Database Testing** | **10** | Bắt buộc cung cấp file script `.sql`. Đánh giá cấu trúc bảng, thiết kế khóa chính (PK), khóa ngoại (FK), ràng buộc (constraints) và quan hệ dữ liệu. Có dữ liệu mẫu (Seed Data). |
| **5. Compatibility Testing** | **5** | Kiểm thử và chạy đồng nhất, ổn định trên ít nhất 3 - 4 trình duyệt: **Chrome, Firefox, Edge, Opera**. |
| **6. Documentation** | **10** | Báo cáo hoàn chỉnh: Problem statement, các sơ đồ (Flowchart, DFD, ERD), mô tả module/logic, phân chia công việc trong nhóm. Không chứa source code. |
| **7. Plagiarism Testing** | **10** | Kiểm tra tính nguyên bản: Không copy-paste từ web có sẵn. Không được nộp code thuần do AI sinh 100%. Phải hiểu toàn bộ code để vấn đáp. AI chỉ được cho phép dùng cho tạo ảnh. |
| **8. Ontime Submission** | **5** | Nộp đúng hạn quy định của cuộc thi. |
| **TỔNG ĐIỂM** | **100** | |

---

## 9. QUY TẮC BẮT BUỘC KHI PHÁT TRIỂN (WORKFLOW & ENVIRONMENT RULES)
- **CẤM CHẠY LỆNH DEV SERVER:** AI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP CHẠY LỆNH `npm run dev`** hoặc bất kỳ lệnh nào tự ý khởi động dev server ngầm.
- Lệnh `npm run dev` sẽ **do Người Dùng (USER) tự chủ động mở và chạy** trong terminal của họ để tránh xung đột cổng (port conflicts/EADDRINUSE) hoặc chiếm tiến trình terminal.
- AI chỉ được phép chạy các lệnh một lần như `npm run build` (kiểm tra lỗi compile), `npx prisma db push`, `npx prisma db seed` hoặc cài đặt thư viện.
- **CẤM DÙNG NATIVE ALERT / CONFIRM / PROMPT:** Tuyệt đối KHÔNG sử dụng `alert()`, `confirm()`, `prompt()` thô sơ của trình duyệt. Tất cả các thông báo trạng thái (Thành công, Thất bại, Cảnh báo, Xác nhận xóa...) BẮT BUỘC phải sử dụng Toast Notification và Dialog Modal Component chuyên dụng của hệ thống để đảm bảo trải nghiệm UX rõ ràng, tinh tế và tái sử dụng nhất quán.
- **CẤM DÙNG VALIDATION TOOLTIP MẶC ĐỊNH CỦA TRÌNH DUYỆT:** Tuyệt đối KHÔNG ĐỂ hiển thị bong bóng tooltip lỗi validation mặc định thô kệch của trình duyệt (ví dụ: "Please fill out this field"). BẮT BUỘC luôn thêm thuộc tính `noValidate` vào tất cả các thẻ `<form noValidate ...>`, đồng thời xử lý kiểm tra hợp lệ dữ liệu (validation) bằng Javascript/Typescript và hiển thị thông báo lỗi rõ ràng qua giao diện (Inline error text, Error banner hoặc Toast notification) để đảm bảo tính thẩm mỹ và đồng bộ 100%.
- **QUY TẮC SINGLETON TOAST (CHỐNG SPAM):** Hệ thống Toast BẮT BUỘC chỉ hiển thị tối đa DUY NHẤT 1 TOAST trên màn hình tại bất kỳ thời điểm nào. Tuyệt đối KHÔNG ĐỂ hiển thị xếp chồng nhiều Toast (gây tràn/rác màn hình) dù người dùng có click liên tục hay spam nút submit. Khi có thông báo mới kích hoạt, thông báo cũ sẽ được thay thế và làm mới bộ đếm thời gian tự động.
- **QUY TẮC CON TRỎ CHUỘT (CURSOR POINTER):** Tất cả các nút bấm (`<button>`, thẻ link nút, `role="button"`, nút submit, icon tương tác click) BẮT BUỘC phải hiển thị con trỏ chuột dạng bàn tay (`cursor: pointer`) khi rê chuột vào để người dùng nhận biết rõ ràng khả năng tương tác. Đã được thiết lập mặc định toàn cục trong `globals.css` và khi bị disabled phải hiển thị `cursor: not-allowed`.




