import { prisma } from "@/lib/database/prisma";
import type { SystemHealthDTO } from "@/types/admin";

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitBreakerConfig {
  failureThreshold: number; // Số lần lỗi liên tiếp để ngắt cầu dao
  resetTimeoutMs: number;   // Thời gian mở cầu dao trước khi thử lại (ms)
}

const config: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 10_000,
};

// Trạng thái Circuit Breaker lưu trong bộ nhớ server
const state = {
  status: "CLOSED" as CircuitBreakerState,
  consecutiveFailures: 0,
  lastFailureTime: 0,
  lastSuccessTime: Date.now(),
};

/**
 * Kiểm tra trạng thái hiện tại của Cầu dao (Circuit Breaker)
 */
export function getCircuitBreakerStatus(): CircuitBreakerState {
  if (state.status === "OPEN") {
    // Nếu đã hết thời gian timeout, chuyển sang HALF_OPEN để thăm dò
    if (Date.now() - state.lastFailureTime > config.resetTimeoutMs) {
      state.status = "HALF_OPEN";
    }
  }
  return state.status;
}

/**
 * Ghi nhận một truy vấn thành công
 */
export function recordSuccess(): void {
  state.consecutiveFailures = 0;
  state.status = "CLOSED";
  state.lastSuccessTime = Date.now();
}

/**
 * Ghi nhận một truy vấn thất bại
 */
export function recordFailure(): void {
  state.consecutiveFailures += 1;
  state.lastFailureTime = Date.now();
  if (state.consecutiveFailures >= config.failureThreshold) {
    state.status = "OPEN";
  }
}

/**
 * Smart Retry with Exponential Backoff:
 * Thử lại tự động với thời gian chờ tăng dần (200ms -> 600ms -> 1200ms) kèm jitter
 */
export async function withSmartRetry<T>(
  operation: () => Promise<T>,
  options: { maxRetries?: number; initialDelayMs?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelayMs ?? 200;

  let attempt = 0;
  while (true) {
    // Nếu cầu dao đang mở (OPEN), ngắt nhanh (Fail-fast) để bảo vệ server
    if (getCircuitBreakerStatus() === "OPEN") {
      throw new Error("CIRCUIT_BREAKER_OPEN: Database connection is temporarily suspended to protect server resources.");
    }

    try {
      const result = await operation();
      recordSuccess();
      return result;
    } catch (err: unknown) {
      attempt += 1;
      recordFailure();

      if (attempt >= maxRetries) {
        throw err;
      }

      // Tính delay theo hàm mũ có jitter ngẫu nhiên
      const jitter = Math.random() * 50;
      const delay = initialDelay * Math.pow(2.5, attempt - 1) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Đo độ trễ thực tế và kiểm tra sức khỏe CSDL bằng `SELECT 1`
 */
export async function checkDatabaseHealth(): Promise<SystemHealthDTO["database"]> {
  const start = performance.now();
  try {
    // Query nhẹ nhàng SELECT 1 để đo ping thật
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);
    recordSuccess();

    return {
      status: latencyMs > 300 ? "degraded" : "healthy",
      latencyMs,
      circuitBreaker: getCircuitBreakerStatus(),
    };
  } catch (err: unknown) {
    recordFailure();
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: "down",
      latencyMs,
      circuitBreaker: getCircuitBreakerStatus(),
    };
  }
}

/**
 * Tổng hợp thông số sức khỏe hệ thống (System Health)
 */
export async function getSystemHealth(): Promise<SystemHealthDTO> {
  const dbHealth = await checkDatabaseHealth();
  const mem = process.memoryUsage();

  return {
    database: dbHealth,
    server: {
      uptimeSeconds: Math.round(process.uptime()),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      timezone: "Asia/Ho_Chi_Minh",
    },
  };
}
