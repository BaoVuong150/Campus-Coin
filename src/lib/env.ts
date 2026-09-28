/**
 * Đọc biến môi trường bắt buộc. Thiếu biến → ném lỗi cấu hình ngay thay vì âm thầm dùng giá trị mặc định.
 */
export class ConfigurationError extends Error {
  constructor(name: string) {
    super(`Missing required environment variable: ${name}`);
    this.name = "ConfigurationError";
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") throw new ConfigurationError(name);
  return value;
}

const MIN_JWT_SECRET_LENGTH = 32;

export function getJwtSecret(): string {
  const secret = requireEnv("JWT_SECRET");
  if (process.env.NODE_ENV === "production" && secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production.`);
  }
  return secret;
}

export const isProduction = process.env.NODE_ENV === "production";
