"use client";

import Link from "next/link";
import { Activity, ArrowRightLeft, Banknote, UserPlus, Users } from "lucide-react";
import { SingleSeriesChart } from "@/components/charts/single-series-chart";
import { ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SkeletonCard, SkeletonChart } from "@/components/ui/skeleton";
import { useAdminOverview } from "@/hooks/use-admin";
import { formatDate } from "@/lib/utils/date";
import { formatNumber, formatPercent, formatVND } from "@/lib/utils/money";

function Kpi({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon: typeof Users }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <Icon className="size-4 text-subtle" aria-hidden />
      </div>
      <p className="tabular mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, error, reload } = useAdminOverview();

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Tình hình hoạt động toàn hệ thống. Không hiển thị dữ liệu xác thực của người dùng." />
      {error ? (
        <Card>
          <ErrorState onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <Card className="p-5">
            <SkeletonChart />
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Tổng sinh viên" value={formatNumber(data.totals.users)} icon={Users} />
            <Kpi label="Hoạt động (30 ngày)" value={formatNumber(data.totals.activeUsers)} hint={data.totals.users ? `${formatPercent((data.totals.activeUsers / data.totals.users) * 100, 0)} tổng số` : undefined} icon={Activity} />
            <Kpi label="Người dùng mới tháng này" value={formatNumber(data.totals.newUsersThisMonth)} icon={UserPlus} />
            <Kpi label="Giao dịch tháng này" value={formatNumber(data.totals.transactionsThisMonth)} hint={`Tổng: ${formatNumber(data.totals.transactions)} · Giá trị ${formatVND(data.totals.volumeThisMonth)}`} icon={ArrowRightLeft} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title="Tăng trưởng người dùng" description="Tổng số sinh viên theo tháng" />
              <CardContent>
                <SingleSeriesChart data={data.userGrowth} dataKey="totalUsers" name="Tổng người dùng" kind="area" />
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title="Khối lượng giao dịch" description="Tổng giá trị giao dịch theo tháng" icon={<Banknote />} />
              <CardContent>
                <SingleSeriesChart data={data.transactionVolume} dataKey="volume" name="Giá trị" kind="bar" format="money" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader title="Phân bổ chi tiêu theo danh mục" description="6 tháng gần nhất, toàn hệ thống" />
              <CardContent className="space-y-3">
                {data.categoryDistribution.length === 0 ? (
                  <p className="text-[13px] text-muted">Chưa có dữ liệu.</p>
                ) : (
                  data.categoryDistribution.slice(0, 8).map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-foreground">{c.name}</span>
                        <span className="tabular text-muted">{formatPercent(c.percentage, 0)}</span>
                      </div>
                      <Progress value={c.percentage} label={`Tỷ trọng ${c.name}`} size="sm" tone="info" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader
                title="Đăng ký gần đây"
                action={
                  <Link href="/admin/users" className="text-[13px] font-medium text-primary hover:underline">
                    Quản lý người dùng
                  </Link>
                }
              />
              <CardContent className="overflow-x-auto pt-2">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-left text-[12px] text-muted">
                    <tr>
                      <th scope="col" className="py-2 font-medium">Người dùng</th>
                      <th scope="col" className="py-2 font-medium">Vai trò</th>
                      <th scope="col" className="py-2 font-medium">Giao dịch</th>
                      <th scope="col" className="py-2 text-right font-medium">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={u.name} className="size-7 text-[11px]" />
                            <span className="min-w-0">
                              <span className="block truncate text-foreground">{u.name}</span>
                              <span className="block truncate text-[12px] text-subtle">{u.email}</span>
                            </span>
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Badge tone={u.role === "admin" ? "info" : "neutral"}>{u.role === "admin" ? "Admin" : "Sinh viên"}</Badge>
                        </td>
                        <td className="tabular py-2.5 text-muted">{formatNumber(u.transactionCount)}</td>
                        <td className="tabular py-2.5 text-right text-muted">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
