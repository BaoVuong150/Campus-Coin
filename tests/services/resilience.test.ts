import { describe, expect, it, vi } from "vitest";
import {
  getCircuitBreakerStatus,
  recordFailure,
  recordSuccess,
  withSmartRetry,
} from "@/lib/database/resilience";

describe("Database Resilience & Circuit Breaker", () => {
  it("thành công ngay lần gọi đầu tiên mà không phải thử lại", async () => {
    recordSuccess();
    const mockFn = vi.fn().mockResolvedValue("data_ok");

    const result = await withSmartRetry(mockFn);
    expect(result).toBe("data_ok");
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(getCircuitBreakerStatus()).toBe("CLOSED");
  });

  it("thử lại tự động khi gặp lỗi tạm thời và thành công ở lần sau", async () => {
    recordSuccess();
    let attempts = 0;
    const mockFn = vi.fn().mockImplementation(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("Temporary connection glitch");
      }
      return "retry_success";
    });

    const result = await withSmartRetry(mockFn, { maxRetries: 3, initialDelayMs: 10 });
    expect(result).toBe("retry_success");
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(getCircuitBreakerStatus()).toBe("CLOSED");
  });

  it("ngắt cầu dao (Circuit Breaker OPEN) sau khi tích lũy 5 lần lỗi liên tiếp", () => {
    recordSuccess();
    expect(getCircuitBreakerStatus()).toBe("CLOSED");

    recordFailure();
    recordFailure();
    recordFailure();
    recordFailure();
    expect(getCircuitBreakerStatus()).toBe("CLOSED");

    // Lần thứ 5 đạt ngưỡng: cầu dao phải OPEN
    recordFailure();
    expect(getCircuitBreakerStatus()).toBe("OPEN");
  });

  it("khi Circuit Breaker OPEN, withSmartRetry từ chối ngay (Fail-fast) không gọi CSDL", async () => {
    // Đảm bảo cầu dao đang OPEN
    for (let i = 0; i < 5; i++) recordFailure();
    expect(getCircuitBreakerStatus()).toBe("OPEN");

    const mockFn = vi.fn().mockResolvedValue("should_not_run");
    await expect(withSmartRetry(mockFn)).rejects.toThrow("CIRCUIT_BREAKER_OPEN");
    expect(mockFn).not.toHaveBeenCalled();

    // Reset lại trạng thái để không ảnh hưởng test khác
    recordSuccess();
    expect(getCircuitBreakerStatus()).toBe("CLOSED");
  });
});
