import { prisma } from "@/lib/database/prisma";
import { ApiError, Errors } from "@/lib/api/errors";
import { emailLayout, sendMail } from "@/lib/mail/mailer";
import type { Messages } from "@/i18n";
import { categoryName, periodLabel } from "@/i18n/format";
import { formatDate } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { ReportPeriod } from "@/types/finance";
import { getReport, type ReportOptions } from "./analytics.service";

const TOP_CATEGORIES = 3;

/**
 * Gửi tóm tắt báo cáo kỳ đang xem tới email của CHÍNH người dùng (SRS 3.10) – không cho nhập địa chỉ khác
 * để không thể dùng làm công cụ gửi thư rác. Số liệu lấy từ cùng báo cáo phía server như trên màn hình.
 */
export async function emailReport(
  userId: string,
  period: ReportPeriod,
  anchor: string,
  t: Messages,
  baseUrl: string,
  options: ReportOptions = {}
): Promise<"sent" | "saved_locally"> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) throw Errors.notFound("USER_NOT_FOUND", "Không tìm thấy người dùng.");
  const report = await getReport(userId, period, anchor, new Date(), options);
  const e = t.reports.email;
  const label = report.custom ? t.reports.filters.custom(formatDate(report.from), formatDate(report.to)) : periodLabel(t, period, anchor);
  const net = report.totals.net;

  const lines = [
    `${e.income}: ${formatVND(report.totals.income)}`,
    `${e.expense}: ${formatVND(report.totals.expense)}`,
    `${e.net}: ${net < 0 ? "− " : ""}${formatVND(Math.abs(net))}`,
    `${e.avgDaily}: ${formatVND(report.totals.averageDailySpend)}`,
    `${e.transactions}: ${report.totals.transactionCount}`,
  ];
  const top = report.categories.slice(0, TOP_CATEGORIES).map((c) => `${categoryName(t, c.name)} – ${formatVND(c.amount)} (${Math.round(c.percentage)}%)`);
  const largest = report.largestTransactions[0];
  const overBudget = report.budgetPerformance.filter((b) => b.percentage > 100).length;

  const paragraphs = [
    e.greeting(user.name),
    e.intro(label, formatDate(report.from), formatDate(report.to)),
    ...lines,
    ...(top.length ? [`${e.topCategories}: ${top.join("; ")}`] : []),
    ...(largest ? [`${e.largest}: ${largest.description} – ${formatVND(largest.amount)} (${formatDate(largest.date)})`] : []),
    ...(report.budgetPerformance.length ? [e.budgets(report.budgetPerformance.length, overBudget)] : []),
  ];
  const link = `${baseUrl}/reports`;

  const result = await sendMail({
    kind: "report",
    to: user.email,
    subject: e.subject(label),
    text: [...paragraphs, "", `${e.open}: ${link}`].join("\n"),
    html: emailLayout({ heading: e.subject(label), paragraphs, action: { label: e.open, url: link }, footer: e.footer }),
  });
  if (result === "sent" || result === "saved_locally") return result;
  if (result === "not_configured") throw new ApiError(503, "EMAIL_UNAVAILABLE", "Hệ thống chưa bật gửi email.");
  throw new ApiError(502, "INTERNAL_ERROR", "Không gửi được email. Vui lòng thử lại sau.");
}
