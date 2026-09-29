import { describe, expect, it } from "vitest";
import { daysBetween, groupByWeek } from "@/lib/finance/report";

/** Tổng kết theo tuần và khoảng ngày tùy chọn của báo cáo (SRS: daily & weekly summaries, lọc theo khoảng ngày). */
describe("báo cáo: tổng kết theo tuần", () => {
  it("tuần bắt đầu thứ Hai; tuần đầu/cuối bị cắt theo kỳ", () => {
    // 01/09/2026 là thứ Ba → tuần đầu 01–06/09, tuần sau bắt đầu thứ Hai 07/09.
    const points = daysBetween("2026-09-01", "2026-09-14").map((key, i) => ({ key, income: i === 0 ? 1000 : 0, expense: 10 }));
    const weeks = groupByWeek(points);
    expect(weeks.map((w) => [w.start, w.end])).toEqual([
      ["2026-09-01", "2026-09-06"],
      ["2026-09-07", "2026-09-13"],
      ["2026-09-14", "2026-09-14"],
    ]);
    expect(weeks[0]).toMatchObject({ income: 1000, expense: 60 });
    expect(weeks[1].expense).toBe(70);
    expect(weeks.reduce((a, w) => a + w.expense, 0)).toBe(140);
  });

  it("chuỗi rỗng → không có tuần", () => {
    expect(groupByWeek([])).toEqual([]);
  });
});

describe("báo cáo: khoảng ngày", () => {
  it("bao gồm hai đầu, qua ranh giới tháng/năm theo giờ Việt Nam", () => {
    expect(daysBetween("2026-12-30", "2027-01-02")).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(daysBetween("2026-02-27", "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
    expect(daysBetween("2026-09-05", "2026-09-05")).toEqual(["2026-09-05"]);
  });
});
