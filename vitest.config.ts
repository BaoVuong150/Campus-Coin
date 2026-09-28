import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { JWT_SECRET: "test-secret-with-at-least-thirty-two-chars!!" },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "html"],
      // Đo độ phủ phần logic phía server (tài chính, xác thực, validate, service); UI được kiểm thử thủ công.
      include: ["src/lib/**/*.ts", "src/services/**/*.ts"],
      exclude: ["src/lib/report-pdf.ts", "src/lib/theme-script.ts", "src/lib/api-client.ts", "src/lib/database/**"],
    },
  },
});
