# Campus Coin – Design System

Giao diện hiện đại, tối giản, kiểu FinTech (tham khảo tinh thần Linear, Stripe, Wise) nhưng mang cá tính riêng của Campus Coin:
trẻ trung, kỷ luật tài chính, đáng tin cậy. **Coin chỉ là branding – không phải ứng dụng crypto.**

Nguồn sự thật của mọi giá trị bên dưới là `src/app/globals.css`. Component chỉ dùng token (utility `bg-surface`, `text-muted`,
`border-border`, `bg-primary`…), không dùng mã màu cứng.

## Màu sắc (design tokens)

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--background` | `#fafbfa` | `#0b0e0d` | Nền trang |
| `--surface` / `--surface-secondary` | `#ffffff` / `#f5f7f5` | `#111513` / `#161b18` | Card, ô nhập / nền phụ |
| `--border` | `rgb(15 23 20 / .08)` | `rgb(255 255 255 / .08)` | Đường viền mảnh |
| `--foreground` / `--muted` / `--subtle` | `#101312` / `#626966` / `#737b77` | `#f4f7f5` / `#a7b0ab` / `#8b9690` | Chữ chính / phụ / chú thích |
| `--primary` | `#047857` (emerald) | `#10b981` | Nút chính, chữ nhấn (đạt tương phản AA) |
| `--brand` / `--brand-bright` | `#059669` / `#10b981` | `#10b981` / `#34d399` | Màu thương hiệu cho thanh tiến độ, điểm nhấn, glow |
| `--success` | `#047857` | `#34d399` | Thu nhập, trạng thái tốt |
| `--danger` | `#c9343a` | `#f08080` | Chi tiêu, vượt ngân sách, xóa |
| `--warning` | `#b45309` | `#fbbf24` | Chạm 80% ngân sách, bất thường |
| `--info` | `#2563eb` | `#60a5fa` | Thông tin trung tính |
| `--inverse` (+ `-foreground/-muted/-border`) | `#0e1311` | `#070908` | Section nền tối (Bảo mật) trên landing |

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
- Không dùng gradient chữ, neon, glassmorphism hay emoji; chỉ một vầng sáng emerald rất nhẹ sau hero (`hero-glow`).
- Mọi tuyên bố ở section Bảo mật phải đúng với cài đặt thực tế (không liên kết ngân hàng, dữ liệu tách theo tài khoản, mật khẩu băm + cookie httpOnly).
