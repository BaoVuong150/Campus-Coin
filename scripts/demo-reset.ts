/**
 * Đặt lại DỮ LIỆU DEMO (xóa toàn bộ rồi nạp seed). Dành cho môi trường demo/chấm thi riêng, KHÔNG dùng cho production.
 *
 *   DEMO_RESET_CONFIRM=<host của DATABASE_URL> npm run demo:reset
 *
 * Chốt chặn (phải qua cả ba):
 *   1. NODE_ENV khác "production".
 *   2. DEMO_RESET_CONFIRM phải gõ đúng host của database sẽ bị xóa (tránh chạy nhầm DB).
 *   3. Host không nằm trong PROTECTED_DATABASE_HOSTS (danh sách host production, phân tách bằng dấu phẩy).
 * Seed tự có thêm chốt SEED_RESET=true và chặn NODE_ENV=production.
 */
import { spawnSync } from "node:child_process";

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) fail("Thiếu DATABASE_URL.");
if (process.env.NODE_ENV === "production") fail("Từ chối: NODE_ENV=production.");

let host: string;
try {
  host = new URL(url).host;
} catch {
  fail("DATABASE_URL không hợp lệ.");
}

const protectedHosts = (process.env.PROTECTED_DATABASE_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
if (protectedHosts.includes(host)) fail(`Từ chối: ${host} nằm trong PROTECTED_DATABASE_HOSTS.`);

if (process.env.DEMO_RESET_CONFIRM !== host) {
  fail(`Để xác nhận, chạy lại với DEMO_RESET_CONFIRM=${host} (toàn bộ dữ liệu trên host này sẽ bị xóa).`);
}

console.info(`Đang đặt lại dữ liệu demo trên ${host}…`);
const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, SEED_RESET: "true" },
});
process.exit(result.status ?? 1);
