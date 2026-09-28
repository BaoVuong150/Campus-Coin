import { describe, expect, it } from "vitest";
import { hasRequiredColumns, mapHeaders, parseAmount, parseDate, parseRecords, parseType } from "@/lib/csv/transactions-csv";

describe("CSV import parsing", () => {
  it("nhận tên cột tiếng Việt và tiếng Anh", () => {
    expect(mapHeaders(["Ngày", "Mô tả", "Số tiền", "Danh mục"])).toEqual({
      date: "Ngày",
      description: "Mô tả",
      amount: "Số tiền",
      category: "Danh mục",
    });
    expect(hasRequiredColumns(mapHeaders(["date", "amount"]))).toBe(false);
  });

  it.each([
    ["2026-09-01", "2026-09-01"],
    ["01/09/2026", "2026-09-01"],
    ["1-9-2026", "2026-09-01"],
    ["31/02/2026", null],
    ["hôm nay", null],
  ])("ngày %s → %s", (raw, expected) => {
    expect(parseDate(raw)).toBe(expected);
  });

  it.each([
    ["45.000", 45000],
    ["45,000", 45000],
    ["1.250.000 ₫", 1250000],
    ["-45000", -45000],
    ["12.5", 12.5],
    ["abc", null],
    ["0", null],
  ])("số tiền %s → %s", (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it("loại giao dịch theo cột hoặc theo dấu", () => {
    expect(parseType("Thu", 100)).toBe("income");
    expect(parseType("chi tiêu", 100)).toBe("expense");
    expect(parseType("", -100)).toBe("expense");
    expect(parseType("income", -100)).toBeNull();
    expect(parseType("xyz", 100)).toBeNull();
  });

  it("gom lỗi theo từng dòng", () => {
    const mapping = mapHeaders(["date", "description", "amount"]);
    const rows = parseRecords(
      [
        { date: "2026-09-01", description: "Highlands", amount: "-45.000" },
        { date: "sai", description: "", amount: "x" },
      ],
      mapping
    );
    expect(rows[0]).toMatchObject({ line: 2, date: "2026-09-01", amount: 45000, type: "expense", errors: [] });
    expect(rows[1].errors).toEqual(["date", "description", "amount"]);
  });
});
