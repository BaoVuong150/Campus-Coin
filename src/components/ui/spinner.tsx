import { cn } from "@/lib/utils/cn";

interface SpinnerProps {
  className?: string;
  /** Có label → trình đọc màn hình đọc được; không có → chỉ để trang trí (đã có chữ đi kèm). */
  label?: string;
}

/** Vòng xoay tải dữ liệu dùng chung (nút, trang tải). Màu theo `currentColor`, cỡ mặc định 16px. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-4 shrink-0 animate-spin", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
