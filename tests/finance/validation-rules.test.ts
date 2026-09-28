import { describe, expect, it } from "vitest";
import { isEmailLike, isStrongPassword } from "@/lib/validations/rules";
import { passwordSchema } from "@/lib/validations/auth.schema";

describe("quy tắc validate dùng chung", () => {
  it.each([
    ["Student@123", true],
    ["abcdefgh", false],
    ["12345678", false],
    ["abc123", false],
  ])("mật khẩu %s → %s", (value, expected) => {
    expect(isStrongPassword(value)).toBe(expected);
    expect(passwordSchema.safeParse(value).success).toBe(expected);
  });

  it("email", () => {
    expect(isEmailLike(" an@truong.edu.vn ")).toBe(true);
    expect(isEmailLike("an@truong")).toBe(false);
  });
});
