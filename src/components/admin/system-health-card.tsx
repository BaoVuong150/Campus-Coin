import { Activity, Cpu, Database, RefreshCw, Server, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SystemHealthDTO } from "@/types/admin";

interface SystemHealthCardProps {
  health?: SystemHealthDTO;
  onRefresh?: () => void;
  isLoading?: boolean;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d} ngày ${h} giờ`;
  if (h > 0) return `${h} giờ ${m} phút`;
  if (m > 0) return `${m} phút ${s} giây`;
  return `${s} giây`;
}

export function SystemHealthCard({ health, onRefresh, isLoading }: SystemHealthCardProps) {
  if (!health) return null;

  const db = health.database;
  const srv = health.server;

  const dbStatusTone =
    db.status === "healthy" ? "success" : db.status === "degraded" ? "warning" : "danger";
  const dbStatusText =
    db.status === "healthy" ? "Hoạt động tốt" : db.status === "degraded" ? "Phản hồi chậm" : "Mất kết nối";

  const cbStatusTone =
    db.circuitBreaker === "CLOSED" ? "success" : db.circuitBreaker === "HALF_OPEN" ? "warning" : "danger";
  const cbStatusText =
    db.circuitBreaker === "CLOSED"
      ? "Đóng (Bình thường)"
      : db.circuitBreaker === "HALF_OPEN"
      ? "Thăm dò (Half-Open)"
      : "Ngắt cầu dao (Open)";

  const memoryPercent = srv.heapTotalMB > 0 ? Math.round((srv.heapUsedMB / srv.heapTotalMB) * 100) : 0;
  const memoryTone = memoryPercent > 85 ? "danger" : memoryPercent > 70 ? "warning" : "info";

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Trạng thái hệ thống & CSDL"
        description="Giám sát độ trễ thời gian thực, cơ chế phục hồi tự động và tài nguyên máy chủ"
        icon={<Activity className="text-primary-ink" />}
        action={
          onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-secondary hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
              title="Làm mới trạng thái hệ thống"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Kiểm tra lại
            </button>
          )
        }
      />
      <CardContent className="space-y-4 pt-1">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* CSDL Ping */}
          <div className="rounded-xl border border-border bg-surface-secondary/50 p-3.5 transition-all hover:bg-surface-secondary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Database className="size-3.5 text-primary-ink" /> PostgreSQL
              </span>
              <Badge tone={dbStatusTone} className="flex items-center gap-1">
                <span
                  className={`size-1.5 rounded-full ${
                    db.status === "healthy"
                      ? "bg-emerald-500 animate-pulse"
                      : db.status === "degraded"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                />
                {dbStatusText}
              </Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="tabular text-xl font-bold tracking-tight text-foreground">
                {db.latencyMs} <span className="text-xs font-normal text-muted">ms</span>
              </span>
              <span className="text-[11px] text-subtle">SELECT 1</span>
            </div>
          </div>

          {/* Circuit Breaker */}
          <div className="rounded-xl border border-border bg-surface-secondary/50 p-3.5 transition-all hover:bg-surface-secondary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <ShieldCheck className="size-3.5 text-primary-ink" /> Circuit Breaker
              </span>
              <Badge tone={cbStatusTone}>{cbStatusText}</Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">Fail-Safe Auto-Cut</span>
              <span className="text-[11px] text-subtle">Ngưỡng: 5 lỗi</span>
            </div>
          </div>

          {/* Smart Retry */}
          <div className="rounded-xl border border-border bg-surface-secondary/50 p-3.5 transition-all hover:bg-surface-secondary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Zap className="size-3.5 text-amber-500" /> Smart Retry
              </span>
              <Badge tone="primary">Exponential</Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">Backoff + Jitter</span>
              <span className="text-[11px] text-subtle">3 lần thử tự động</span>
            </div>
          </div>

          {/* Server Uptime */}
          <div className="rounded-xl border border-border bg-surface-secondary/50 p-3.5 transition-all hover:bg-surface-secondary">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Server className="size-3.5 text-primary-ink" /> Máy chủ Uptime
              </span>
              <Badge tone="neutral">{srv.environment}</Badge>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-foreground">{formatUptime(srv.uptimeSeconds)}</span>
              <span className="text-[11px] text-subtle">{srv.nodeVersion}</span>
            </div>
          </div>
        </div>

        {/* Memory Bar */}
        <div className="rounded-xl border border-border bg-surface-secondary/40 p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Cpu className="size-3.5 text-muted" /> Bộ nhớ Heap Node.js
            </span>
            <span className="tabular text-muted">
              {srv.heapUsedMB} MB / {srv.heapTotalMB} MB ({memoryPercent}%)
            </span>
          </div>
          <Progress value={memoryPercent} tone={memoryTone} label="Bộ nhớ Heap Node.js" size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
