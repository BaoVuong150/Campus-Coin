import { describe, expect, it } from "vitest";
import { matchRule, normalizeText, preferenceKey } from "@/lib/finance/categorize";

describe("smart categorization rules", () => {
  it("chuẩn hóa tiếng Việt", () => {
    expect(normalizeText("Cà phê Highlands – Đà Nẵng!")).toBe("ca phe highlands da nang");
  });

  it.each([
    ["GrabFood trưa", "food"],
    ["Grab Bike đi học", "transport"],
    ["Đơn Shopee", "shopping"],
    ["Vé CGV cuối tuần", "entertainment"],
    ["Highlands Coffee", "food"],
    ["Netflix tháng 10", "subscriptions"],
    ["Tiền trọ tháng 10", "housing"],
    ["Mẹ gửi tiền trợ cấp", "allowance"],
    ["Lương gia sư", "part_time"],
  ])("%s → %s", (text, expected) => {
    expect(matchRule(text)?.category).toBe(expected);
  });

  it("khớp theo ranh giới từ (không nhầm 'be' trong 'bebe')", () => {
    expect(matchRule("bebe shop")).toBeNull();
  });

  it("lọc theo loại giao dịch", () => {
    expect(matchRule("Lương gia sư", "expense")).toBeNull();
  });

  it("khóa ghi nhớ lấy 2 từ đầu", () => {
    expect(preferenceKey("Highlands Coffee Quận 1")).toBe("highlands coffee");
  });
});
