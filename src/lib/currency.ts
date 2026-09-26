/**
 * Tiện ích xử lý và định dạng tiền tệ VNĐ (hỗ trợ tự động thêm dấu phân cách hàng nghìn khi gõ)
 */

// Định dạng chuỗi gõ vào ô input thành định dạng có dấu chấm phân cách (vd: 5000000 -> 5.000.000)
export function formatCurrencyInput(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === "") return "";
  // Xóa mọi ký tự không phải là chữ số
  const cleanStr = String(val).replace(/\D/g, "");
  if (!cleanStr) return "";
  // Định dạng theo chuẩn locale tiếng Việt (ngăn cách hàng nghìn bằng dấu chấm)
  return Number(cleanStr).toLocaleString("vi-VN");
}

// Chuyển từ chuỗi hiển thị có dấu chấm (5.000.000) thành số nguyên thô (5000000) để tính toán hoặc gửi API
export function parseCurrencyInput(val: string | number | undefined | null): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const raw = String(val).replace(/\D/g, "");
  return raw ? Number(raw) : 0;
}
