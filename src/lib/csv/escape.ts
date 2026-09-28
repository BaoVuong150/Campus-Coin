/** Ký tự đầu ô mà Excel/Google Sheets hiểu là công thức (CSV/formula injection – OWASP). */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/**
 * Một ô CSV an toàn: luôn đặt trong dấu ngoặc kép, nhân đôi dấu ngoặc kép bên trong, và thêm dấu nháy đơn
 * trước giá trị bắt đầu bằng = + - @ để bảng tính hiển thị như chữ thay vì chạy công thức
 * (ví dụ tên người dùng "=HYPERLINK(...)"). Số thực sự (kiểu number) giữ nguyên, kể cả số âm.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const text = String(value);
  const safe = typeof value !== "number" && FORMULA_PREFIX.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Ghép các dòng thành nội dung CSV (CRLF, kèm BOM để Excel nhận đúng tiếng Việt). */
export function toCsv(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
