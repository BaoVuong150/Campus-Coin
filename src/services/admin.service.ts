import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import { currentMonthKey, DAY_MS, monthRange, shiftMonthKey, shortMonthLabel } from "@/lib/utils/date";
import type { adminUpdateUserSchema, adminUserQuerySchema } from "@/lib/validations/admin.schema";
import type { Paginated } from "@/types/finance";
import type { AdminOverviewDTO, AdminUserDTO } from "@/types/admin";

export type { AdminOverviewDTO, AdminUserDTO };
import { toNumber } from "./mappers";

const ACTIVE_WINDOW_DAYS = 30;
const GROWTH_MONTHS = 6;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  is_active: true,
  academic_year: true,
  last_login_at: true,
  created_at: true,
  _count: { select: { transactions: true } },
} satisfies Prisma.UserSelect;

type SelectedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

/** Chỉ trả về thông tin hồ sơ – không bao giờ trả password_hash, token hay dữ liệu xác thực. */
function toAdminUser(u: SelectedUser): AdminUserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "admin" ? "admin" : "student",
    isActive: u.is_active,
    academicYear: u.academic_year,
    transactionCount: u._count.transactions,
    lastLoginAt: u.last_login_at?.toISOString() ?? null,
    createdAt: u.created_at.toISOString(),
  };
}

export async function getAdminOverview(now = new Date()): Promise<AdminOverviewDTO> {
  const month = currentMonthKey(now);
  const thisMonth = monthRange(month);
  const firstMonth = shiftMonthKey(month, -(GROWTH_MONTHS - 1));
  const growthStart = monthRange(firstMonth).start;
  const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * DAY_MS);

  const [users, activeUsers, newUsers, transactions, monthAgg, usersBefore, signups, volumeRows, categories, recent] =
    await Promise.all([
      prisma.user.count({ where: { role: "student" } }),
      prisma.user.count({
        where: {
          role: "student",
          is_active: true,
          OR: [{ last_login_at: { gte: activeSince } }, { transactions: { some: { created_at: { gte: activeSince } } } }],
        },
      }),
      prisma.user.count({ where: { role: "student", created_at: { gte: thisMonth.start, lt: thisMonth.end } } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: { date: { gte: thisMonth.start, lt: thisMonth.end } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.user.count({ where: { role: "student", created_at: { lt: growthStart } } }),
      prisma.$queryRaw<{ key: string; count: number }[]>`
        SELECT to_char("created_at" + INTERVAL '7 hours', 'YYYY-MM') AS key, COUNT(*)::int AS count
        FROM "users" WHERE "role" = 'student' AND "created_at" >= ${growthStart}
        GROUP BY 1`,
      prisma.$queryRaw<{ key: string; count: number; volume: number }[]>`
        SELECT to_char("date" + INTERVAL '7 hours', 'YYYY-MM') AS key, COUNT(*)::int AS count, SUM("amount")::float8 AS volume
        FROM "transactions" WHERE "date" >= ${growthStart} AND "date" < ${thisMonth.end}
        GROUP BY 1`,
      prisma.transaction.groupBy({
        by: ["category_id"],
        where: { type: "expense", date: { gte: growthStart, lt: thisMonth.end } },
        _sum: { amount: true },
      }),
      prisma.user.findMany({ orderBy: { created_at: "desc" }, take: 6, select: userSelect }),
    ]);

  const months = Array.from({ length: GROWTH_MONTHS }, (_, i) => shiftMonthKey(firstMonth, i));
  const signupMap = new Map(signups.map((s) => [s.key, Number(s.count)]));
  let running = usersBefore;
  const userGrowth = months.map((key) => {
    const newUsers = signupMap.get(key) ?? 0;
    running += newUsers;
    return { key, label: shortMonthLabel(key), newUsers, totalUsers: running };
  });

  const volumeMap = new Map(volumeRows.map((v) => [v.key, v]));
  const transactionVolume = months.map((key) => ({
    key,
    label: shortMonthLabel(key),
    count: Number(volumeMap.get(key)?.count ?? 0),
    volume: Number(volumeMap.get(key)?.volume ?? 0),
  }));

  const categoryMeta = await prisma.category.findMany({
    where: { id: { in: categories.map((c) => c.category_id) } },
    select: { id: true, name: true, color: true },
  });
  const metaMap = new Map(categoryMeta.map((c) => [c.id, c]));
  const catTotal = categories.reduce((a, c) => a + toNumber(c._sum.amount), 0);
  const categoryDistribution = categories
    .map((c) => ({
      name: metaMap.get(c.category_id)?.name ?? "Khác",
      color: metaMap.get(c.category_id)?.color ?? null,
      amount: toNumber(c._sum.amount),
      percentage: catTotal > 0 ? (toNumber(c._sum.amount) / catTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totals: {
      users,
      activeUsers,
      newUsersThisMonth: newUsers,
      transactions,
      transactionsThisMonth: monthAgg._count._all,
      volumeThisMonth: toNumber(monthAgg._sum.amount),
    },
    userGrowth,
    transactionVolume,
    categoryDistribution,
    recentUsers: recent.map(toAdminUser),
  };
}

export async function listUsers(query: z.infer<typeof adminUserQuerySchema>): Promise<Paginated<AdminUserDTO>> {
  const where: Prisma.UserWhereInput = {
    ...(query.status === "active" ? { is_active: true } : query.status === "disabled" ? { is_active: false } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { created_at: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items: items.map(toAdminUser),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function updateUser(
  actorId: string,
  targetId: string,
  input: z.infer<typeof adminUpdateUserSchema>
): Promise<AdminUserDTO> {
  if (actorId === targetId) {
    throw Errors.badRequest("Bạn không thể tự vô hiệu hóa hoặc đổi quyền tài khoản của chính mình.");
  }
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw Errors.notFound("USER_NOT_FOUND", "Không tìm thấy người dùng.");

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { is_active: input.is_active, role: input.role },
    select: userSelect,
  });
  return toAdminUser(updated);
}

