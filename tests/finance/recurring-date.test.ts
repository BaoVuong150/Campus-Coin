import { describe, expect, it } from "vitest";
import { collectDueOccurrences, nextOccurrence, occurrencesRemainingInMonth, type Schedule } from "@/lib/finance/recurring";
import {
  cashFlowBuckets,
  currentMonthKey,
  monthRange,
  remainingDaysInMonth,
  toYmd,
  ymdToStorageDate,
} from "@/lib/utils/date";

const monthly31: Schedule = { frequency: "monthly", anchorDay: 31, startDate: ymdToStorageDate("2026-01-31") };

describe("date utils (Asia/Ho_Chi_Minh)", () => {
  it("23:30 giờ VN vẫn thuộc ngày hiện tại, 00:30 VN đã sang tháng mới", () => {
    expect(toYmd(new Date("2026-09-30T16:30:00Z"))).toBe("2026-09-30");
    expect(currentMonthKey(new Date("2026-09-30T17:30:00Z"))).toBe("2026-10");
  });
  it("khoảng tháng bắt đầu từ 00:00 giờ VN", () => {
    const { start, end } = monthRange("2026-09");
    expect(start.toISOString()).toBe("2026-08-31T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-30T17:00:00.000Z");
  });
  it("số ngày còn lại tính cả hôm nay", () => {
    expect(remainingDaysInMonth("2026-09", new Date("2026-09-27T03:00:00Z"))).toBe(4);
    expect(remainingDaysInMonth("2026-08", new Date("2026-09-27T03:00:00Z"))).toBe(0);
  });
  it("bucket 7 ngày kết thúc ở hôm nay", () => {
    const b = cashFlowBuckets("7d", new Date("2026-09-27T03:00:00Z"));
    expect(b.keys).toEqual(["2026-09-21", "2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27"]);
  });
});

describe("recurring schedule", () => {
  it("ngày 31 lùi về cuối tháng ngắn, rồi trở lại 31", () => {
    const feb = nextOccurrence(monthly31, ymdToStorageDate("2026-01-31"));
    expect(toYmd(feb)).toBe("2026-02-28");
    expect(toYmd(nextOccurrence(monthly31, feb))).toBe("2026-03-31");
  });

  it("thu thập các kỳ đến hạn và kỳ kế tiếp", () => {
    const schedule: Schedule = { frequency: "monthly", anchorDay: 8, startDate: ymdToStorageDate("2026-07-08") };
    const r = collectDueOccurrences(schedule, ymdToStorageDate("2026-07-08"), new Date("2026-09-27T03:00:00Z"));
    expect(r.due.map(toYmd)).toEqual(["2026-07-08", "2026-08-08", "2026-09-08"]);
    expect(toYmd(r.nextRunDate)).toBe("2026-10-08");
  });

  it("không có kỳ nào khi chưa đến hạn (idempotent khi gọi lại)", () => {
    const schedule: Schedule = { frequency: "monthly", anchorDay: 8, startDate: ymdToStorageDate("2026-07-08") };
    const r = collectDueOccurrences(schedule, ymdToStorageDate("2026-10-08"), new Date("2026-09-27T03:00:00Z"));
    expect(r.due).toHaveLength(0);
  });

  it("dừng tại ngày kết thúc", () => {
    const schedule: Schedule = {
      frequency: "weekly",
      anchorDay: 1,
      startDate: ymdToStorageDate("2026-09-07"),
      endDate: ymdToStorageDate("2026-09-15"),
    };
    const r = collectDueOccurrences(schedule, ymdToStorageDate("2026-09-07"), new Date("2026-09-27T03:00:00Z"));
    expect(r.due.map(toYmd)).toEqual(["2026-09-07", "2026-09-14"]);
    expect(r.finished).toBe(true);
  });

  it("chỉ lấy kỳ sau hôm nay trong tháng cho dự báo", () => {
    const schedule: Schedule = { frequency: "weekly", anchorDay: 1, startDate: ymdToStorageDate("2026-09-07") };
    const dates = occurrencesRemainingInMonth(schedule, ymdToStorageDate("2026-09-28"), "2026-09", new Date("2026-09-27T03:00:00Z"));
    expect(dates.map(toYmd)).toEqual(["2026-09-28"]);
  });
});
