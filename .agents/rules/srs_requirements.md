# Campus Coin (Techwiz 7) - Software Requirements Specification (SRS) Rule

## Context
Dự án này là **Campus Coin** (Theme: NextGen BudgetBee, Cuộc thi Techwiz 7 - Aptech).
Hạng mục: End-to-End Web Solutions.
Tài liệu gốc: `CampusCoin End-to-End Web Solutions_SRS.pdf`.
Chi tiết tài liệu tổng quan đã được lưu tại [AGENTS.md](file:///c:/workplace/ASPdotNET/Techwiz-7/AGENTS.md).

## Quy chuẩn & Chỉ dẫn cho mọi AI Agent:
1. **Kiến trúc & Công nghệ:**
   - Workspace nằm tại `ASPdotNET/Techwiz-7` -> Ưu tiên tuyệt đối kiến trúc **C# ASP.NET Core** (MVC hoặc Web API + Frontend hiện đại) kết hợp **SQL Server** và **Entity Framework Core**.
2. **Các tính năng cốt lõi bắt buộc:**
   - **Auth & Profiles:** Student & riêng biệt Administrator, Reset pass qua tokenized link/email, Profile (allowance baseline, saving goal), Bulk CSV import.
   - **Category Management:** Phân hệ Thu (Allowance, Part-time, Scholarship, Gift, Other) & Chi (Food, Transport, Hostel/Rent, Academics, Subscriptions, Entertainment, Misc). User tự quản lý thêm/sửa/xóa category riêng.
   - **Dashboard:** Greeting, Monthly balance, Quick-add, Top Category widget, Budget vs Actual widget, Saving Tips engine.
   - **Transaction Logging:** Hỗ trợ Recurring transactions, Audit log đầy đủ.
   - **AI-Driven Features:**
     * Auto category suggestion theo description (có khả năng học và override).
     * Batch categorization khi import CSV.
     * Monthly Spending Insights: Văn bản tự nhiên, cảnh báo tăng trưởng bất thường, đưa ra lời khuyên thực tế.
   - **Reports:** Phân bổ danh mục, Thu vs Chi 6 tháng gần nhất, tổng kết ngày/tuần, xuất báo cáo ra **PDF / Image**.
   - **Budget & Alerts:** Đặt hạn mức theo category, thanh tiến trình real-time, in-app alert.
   - **Admin Panel:** Quản lý default categories, announcement/tips templates, quản lý tài khoản người dùng, thống kê toàn hệ thống.
   - **Advanced UX & Accessibility:** Giao diện Dark/Light mode, chỉnh font size, Breadcrumbs, cảnh báo trùng lặp/bất thường, **Sitemap trực quan ngay trên trang chủ (BẮT BUỘC)**.
3. **Yêu cầu nộp bài & Thang điểm đánh giá (Tổng 100 điểm):**
   - **Functionality Testing (35đ):** Hoàn thiện 100% các chức năng trong SRS.
   - **UI & Accessibility (15đ):** Giao diện đẹp, mượt, responsive trên Desktop/Tablet/Mobile, hỗ trợ Dark mode & font size toggle.
   - **Source Code (10đ):** Cấu trúc chuẩn, có comment giải thích rõ ràng các hàm logic.
   - **Database Testing (10đ):** Script `.sql` chuẩn (PK, FK, Constraints) kèm Seed data.
   - **Compatibility Testing (5đ):** Hoạt động ổn định trên Chrome, Firefox, Edge, Opera.
   - **Documentation (10đ):** Báo cáo đầy đủ sơ đồ Flowchart, DFD, ERD, phân công nhóm (KHÔNG chứa code).
   - **Plagiarism Testing (10đ):** Code nguyên bản, sinh viên hiểu toàn bộ code khi vấn đáp, không nộp code AI nguyên bản 100%.
   - **Ontime Submission (5đ):** Nộp đúng hạn kèm video demo `.mp4` và sitemap trên trang chủ.
4. **Quy tắc thực thi lệnh (Strict Workflow Rule):**
   - **AI TUYỆT ĐỐI KHÔNG CHẠY `npm run dev`:** Lệnh chạy dev server sẽ do USER tự mở và chủ động kiểm soát trong terminal của họ. AI không bao giờ được tự ý khởi động dev server ngầm.


