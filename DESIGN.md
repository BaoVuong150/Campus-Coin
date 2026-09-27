# Campus Coin – Design System

Giao diện hiện đại, tối giản, kiểu FinTech (tham khảo tinh thần Linear, Stripe, Wise) nhưng mang cá tính riêng của Campus Coin:
trẻ trung, kỷ luật tài chính, đáng tin cậy. **Coin chỉ là branding – không phải ứng dụng crypto.**

Nguồn sự thật của mọi giá trị bên dưới là `src/app/globals.css`. Component chỉ dùng token (utility `bg-surface`, `text-muted`,
`border-border`, `bg-primary`…), không dùng mã màu cứng.

## Màu sắc (design tokens)

| Token | Sáng | Tối | Dùng cho |
| --- | --- | --- | --- |
| `--background` | `#f7f8f7` | `#0c0e0d` | Nền trang |
| `--surface` / `--surface-secondary` | `#ffffff` / `#f2f4f3` | `#141715` / `#1a1d1b` | Card, ô nhập / nền phụ |
| `--border` | `#e4e7e5` | `#262a28` | Đường viền mảnh |
| `--foreground` / `--muted` / `--subtle` | `#101513` / `#4f5a55` / `#7a8580` | `#eef2ef` / `#a7b0ab` / `#7d8681` | Chữ chính / phụ / chú thích |
| `--primary` | `#047857` (emerald) | `#10b981` | Nút chính, trạng thái đang chọn, tiến độ |
| `--success` | `#047857` | `#34d399` | Thu nhập, trạng thái tốt |
| `--danger` | `#c9343a` | `#f87171` | Chi tiêu, vượt ngân sách, xóa |
| `--warning` | `#b45309` | `#fbbf24` | Chạm 80% ngân sách, bất thường |
| `--info` | `#2563eb` | `#60a5fa` | Thông tin trung tính |

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

- Bo góc vừa phải: 6 / 8 / 12px (`--radius-sm/md/lg`), không bo tròn mọi thứ.
- Card: nền `surface`, viền mảnh, bóng rất nhẹ (`shadow-card`); popover/dialog dùng `shadow-pop`.
- Khoảng cách theo thang 4 · 8 · 12 · 16 · 24 · 32 · 48.

## Component

Nằm trong `src/components/ui` và `src/components/common`:

- **Button**: `primary` · `secondary` · `outline` · `ghost` · `danger`; cỡ `sm` · `md` · `lg` · `icon`; có trạng thái `loading`.
- **Card / CardHeader / CardContent**, **Badge** (tone), **Progress** (primary · warning · danger), **Segmented** (radiogroup, điều hướng bằng phím mũi tên).
- **Field** gắn nhãn, lỗi inline và `aria-*`; **MoneyInput** tự thêm dấu chấm, bàn phím số trên mobile.
- **Dialog** (`modal` hoặc `sheet`): focus trap, Esc để đóng, không cao quá viewport; **ConfirmDialog** cho mọi thao tác nguy hiểm.
- **Skeleton**, **EmptyState** (luôn có CTA), **ErrorState** (có nút Thử lại), **Toast** (tối đa 1 toast cùng lúc).

## Chuyển động & trợ năng

- Hiệu ứng 150–250ms cho dialog, sidebar, dropdown, hover, thanh tiến độ; không có animation lặp vô hạn; tôn trọng `prefers-reduced-motion`.
- Focus hiển thị rõ (`--ring`), mọi nút icon có `aria-label`, bảng có `scope`, trạng thái không chỉ dựa vào màu (luôn kèm icon/nhãn).
- Responsive từ 375px: sidebar → drawer, bảng → danh sách thẻ, thanh điều hướng dưới cùng trên mobile, không cuộn ngang.

## Ngôn ngữ

Giao diện song ngữ Việt/Anh (`src/i18n`). Mọi chuỗi hiển thị lấy từ từ điển qua `useI18n()` / `getServerMessages()` – không viết chữ cứng trong component.
