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
import { useI18n } from "@/i18n/provider";

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
  const { t, fmt } = useI18n();
  const l = t.admin;

  return (
    <div>
      <PageHeader title={t.nav.adminDashboard} description={l.dashboardDescription} />
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
            <Kpi label={l.totalStudents} value={formatNumber(data.totals.users)} icon={Users} />
            <Kpi label={l.active30} value={formatNumber(data.totals.activeUsers)} hint={data.totals.users ? l.ofTotal(formatPercent((data.totals.activeUsers / data.totals.users) * 100, 0)) : undefined} icon={Activity} />
            <Kpi label={l.newThisMonth} value={formatNumber(data.totals.newUsersThisMonth)} icon={UserPlus} />
            <Kpi label={l.txThisMonth} value={formatNumber(data.totals.transactionsThisMonth)} hint={l.txHint(formatNumber(data.totals.transactions), formatVND(data.totals.volumeThisMonth))} icon={ArrowRightLeft} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0">
              <CardHeader title={l.growth} description={l.growthHint} />
              <CardContent>
                <SingleSeriesChart data={data.userGrowth} dataKey="totalUsers" name={l.totalUsers} kind="area" />
              </CardContent>
            </Card>
            <Card className="min-w-0">
              <CardHeader title={l.volume} description={l.volumeHint} icon={<Banknote />} />
              <CardContent>
                <SingleSeriesChart data={data.transactionVolume} dataKey="volume" name={l.value} kind="bar" format="money" />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="min-w-0 lg:col-span-2">
              <CardHeader title={l.distribution} description={l.distributionHint} />
              <CardContent className="space-y-3">
                {data.categoryDistribution.length === 0 ? (
                  <p className="text-[13px] text-muted">{l.noData}</p>
                ) : (
                  data.categoryDistribution.slice(0, 8).map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-foreground">{fmt.category(c.name)}</span>
                        <span className="tabular text-muted">{formatPercent(c.percentage, 0)}</span>
                      </div>
                      <Progress value={c.percentage} label={l.share(fmt.category(c.name))} size="sm" tone="info" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
            <Card className="min-w-0 lg:col-span-3">
              <CardHeader
                title={l.recent}
                action={
                  <Link href="/admin/users" className="text-[13px] font-medium text-primary hover:underline">
                    {l.manageUsers}
                  </Link>
                }
              />
              <CardContent className="overflow-x-auto pt-2">
                <table className="w-full min-w-120 text-sm">
                  <thead className="text-left text-[12px] text-muted">
                    <tr>
                      <th scope="col" className="py-2 font-medium">{l.user}</th>
                      <th scope="col" className="py-2 font-medium">{l.role}</th>
                      <th scope="col" className="py-2 font-medium">{l.transactions}</th>
                      <th scope="col" className="py-2 text-right font-medium">{l.createdAt}</th>
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
                          <Badge tone={u.role === "admin" ? "info" : "neutral"}>{l.roles[u.role]}</Badge>
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
