# Campus Coin – Design System

Giao diện hiện đại, tối giản, kiểu FinTech (tham khảo tinh thần Linear, Stripe, Wise) nhưng mang cá tính riêng của Campus Coin:
trẻ trung, kỷ luật tài chính, đáng tin cậy. **Coin chỉ là branding – không phải ứng dụng crypto.**

Nguồn sự thật của mọi giá trị bên dưới là `src/app/globals.css`. Component chỉ dùng token (utility `bg-surface`, `text-muted`,
`border-border`, `bg-primary`…), không dùng mã màu cứng.

## Màu sắc (design tokens)

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--background` | `#f7fafa` | `#081110` | Nền trang (xám ngả teal) |
| `--surface` / `--surface-secondary` | `#ffffff` / `#f1f6f6` | `#0c1817` / `#122120` | Card, ô nhập / nền phụ |
| `--border` | `rgb(12 45 43 / .09)` | `rgb(255 255 255 / .08)` | Đường viền mảnh |
| `--foreground` / `--muted` / `--subtle` | `#0b1716` / `#56686a` / `#647677` | `#eef6f5` / `#9eb2b1` / `#8a9e9d` | Chữ chính / phụ / chú thích |
| `--primary` / `--primary-foreground` | `#2dd4bf` (teal) / `#042f2e` | `#2dd4bf` / `#042f2e` | Nền nút chính, CTA, logo; chữ tối trên nền teal (~10:1) |
| `--primary-ink` | `#0f766e` | `#2dd4bf` | Chữ, icon, viền màu nhấn (đạt tương phản AA) |
| `--brand` / `--brand-bright` | `#14b8a6` / `#2dd4bf` | `#2dd4bf` / `#5eead4` | Màu thương hiệu cho thanh tiến độ, điểm nhấn, glow |
| `--success` | `#0f766e` | `#2dd4bf` | Thu nhập, trạng thái tốt |
| `--danger` (chữ) / `--danger-fill` (thanh) | `#c9343a` / `#e5484d` | `#f08080` / `#f08080` | Chi tiêu, vượt ngân sách, xóa |
| `--warning` (chữ) / `--warning-fill` (thanh) | `#b45309` / `#f59e0b` | `#fbbf24` / `#fbbf24` | Chạm 80% ngân sách, bất thường |
| `--info` | `#2563eb` | `#60a5fa` | Thông tin trung tính |
| `--inverse` (+ `-foreground/-muted/-border`) | `#08201e` | `#050d0c` | Section nền tối (Bảo mật) trên landing |

Mỗi màu trạng thái có biến `-soft` cho nền nhạt (badge, thông báo). Không thêm màu ngẫu nhiên ngoài bảng này.

### Biểu đồ

- Thu/Chi: `--chart-income` (`#0d9488` / `#14a391`) và `--chart-expense` (`#e5484d`) – đã kiểm định khả năng phân biệt cho người mù màu ở cả hai chế độ.
- Danh mục: 8 màu categorical `--chart-1…8` gán **cố định theo danh mục** (không theo thứ hạng), phần còn lại gộp vào "Khác" (`--chart-other`).
- Một trục Y, lưới nhạt, tooltip khi hover, luôn có legend khi ≥ 2 chuỗi, có bảng ẩn cho trình đọc màn hình.
- Màu đọc qua hook `useChartColors()` nên tự đổi theo sáng/tối.

## Chữ

- Font: **Geist** (`--font-sans`), số dùng `tabular-nums` (utility `tabular`) để các cột tiền thẳng hàng.
- Thứ bậc: tiêu đề trang 24px/600 → tiêu đề section 15px/600 → số liệu card 26–32px/600 → nhãn 13px → chú thích 12px.
- Tiền luôn hiển thị `1.250.000 ₫`, ngày `dd/MM/yyyy`, múi giờ Asia/Ho_Chi_Minh ở cả hai ngôn ngữ.

## Hình khối & khoảng cách

- Bo góc vừa phải: 6 / 8 / 12 / 16 / 22px (`--radius-sm/md/lg/xl/2xl`); 22px chỉ cho mockup và khối CTA lớn.
- Card: nền `surface`, viền mảnh, bóng rất nhẹ (`shadow-card`); popover/dialog dùng `shadow-pop`; `shadow-mockup` chỉ dành cho mockup sản phẩm ở hero.
- Khoảng cách theo thang 4 · 8 · 12 · 16 · 24 · 32 · 48.

## Component

Nằm trong `src/components/ui` và `src/components/common`:

- **Button**: `primary` · `secondary` · `outline` · `ghost` · `danger`; cỡ `sm` · `md` · `lg` · `xl` (CTA landing 50px) · `icon`; có trạng thái `loading`.
- **Card / CardHeader / CardContent**, **Badge** (tone), **Progress** (primary · warning · danger), **Segmented** (radiogroup, điều hướng bằng phím mũi tên).
- **Field** gắn nhãn, lỗi inline và `aria-*`; **MoneyInput** tự thêm dấu chấm, bàn phím số trên mobile.
- **Dialog** (`modal` hoặc `sheet`): focus trap, Esc để đóng, không cao quá viewport; **ConfirmDialog** cho mọi thao tác nguy hiểm.
- **Skeleton**, **EmptyState** (luôn có CTA), **ErrorState** (có nút Thử lại), **Toast** (tối đa 1 toast cùng lúc).

## Chuyển động & trợ năng

- Hiệu ứng 150–250ms cho dialog, sidebar, dropdown, hover, thanh tiến độ; tôn trọng `prefers-reduced-motion` (tắt lặp, bỏ độ trễ).
- Landing: `rise` (xuất hiện tuần tự), `grow-x/grow-y` (thanh tiến độ, cột biểu đồ) và một thẻ nổi `float` 6s duy nhất – ngoài ra không có animation lặp.
- Focus hiển thị rõ (`--ring`), mọi nút icon có `aria-label`, bảng có `scope`, trạng thái không chỉ dựa vào màu (luôn kèm icon/nhãn).
- Responsive từ 375px: sidebar → drawer, bảng → danh sách thẻ, thanh điều hướng dưới cùng trên mobile, không cuộn ngang.

## Ngôn ngữ

Giao diện song ngữ Việt/Anh (`src/i18n`). Mọi chuỗi hiển thị lấy từ từ điển qua `useI18n()` / `getServerMessages()` – không viết chữ cứng trong component.

## Landing

- Component nằm trong `src/components/landing` (mockup dashboard ở `landing/dashboard`), dữ liệu mẫu tập trung ở `src/data/demo-finance.ts` và luôn gắn nhãn "Dữ liệu mẫu".
- Không dùng gradient chữ, neon, glassmorphism hay emoji; chỉ một vầng sáng teal rất nhẹ sau hero (`hero-glow`).
- Mọi tuyên bố ở section Bảo mật phải đúng với cài đặt thực tế (không liên kết ngân hàng, dữ liệu tách theo tài khoản, mật khẩu băm + cookie httpOnly).

> Không dùng `text-primary` cho chữ: `#2dd4bf` quá nhạt trên nền sáng – luôn dùng `text-primary-ink`.
