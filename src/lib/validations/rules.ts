import { PASSWORD_MIN_LENGTH } from "@/constants/finance";

/**
 * Quy tắc kiểm tra dùng chung cho form phía client và Zod schema phía server
 * (không phụ thuộc zod để client không phải tải thêm).
 */
export function isStrongPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH && /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function isEmailLike(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}
