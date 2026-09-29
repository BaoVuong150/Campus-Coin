import { describe, expect, it } from "vitest";
import { DATA_INTENTS, detectIntent } from "@/lib/assistant/intents";

describe("trợ lý: nhận diện ý định câu hỏi", () => {
  it.each([
    ["Tháng này mình còn bao nhiêu?", "balance"],
    ["How much did I spend this month?", "balance"],
    ["Hôm nay được chi bao nhiêu?", "safeToSpend"],
    ["How much can I spend today?", "safeToSpend"],
    ["Danh mục nào chi nhiều nhất?", "topCategory"],
    ["Ngân sách thế nào rồi?", "budget"],
    ["Am I over budget?", "budget"],
    ["Cách nhập file CSV?", "importCsv"],
    ["Làm sao thêm giao dịch", "addTransaction"],
    ["Tạo khoản định kỳ hàng tháng", "recurring"],
    ["Xuất báo cáo PDF", "reports"],
    ["Cho mình mẹo tiết kiệm", "tips"],
    ["Quên mật khẩu", "password"],
    ["Bật chế độ tối", "appearance"],
    ["Xin chào", "greeting"],
  ])("%s → %s", (question, intent) => {
    expect(detectIntent(question)).toBe(intent);
  });

  it("không nhận ra hoặc rỗng → null (hiện gợi ý thay vì trả lời bừa)", () => {
    expect(detectIntent("thời tiết Hà Nội")).toBeNull();
    expect(detectIntent("   ")).toBeNull();
  });

  it("khớp nguyên từ, không khớp một phần (login ≠ log)", () => {
    expect(detectIntent("login")).toBe("password");
  });

  it("chỉ các câu hỏi số liệu mới gọi API", () => {
    expect([...DATA_INTENTS].sort()).toEqual(["balance", "budget", "safeToSpend", "topCategory"]);
  });
});
