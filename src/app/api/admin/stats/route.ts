import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Allow demo admin check
    const totalUsers = await prisma.user.count({ where: { role: "student" } });
    const totalTransactions = await prisma.transaction.count();
    const categoriesCount = await prisma.category.count();
    const budgetsCount = await prisma.budget.count();

    const recentUsers = await prisma.user.findMany({
      where: { role: "student" },
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        academic_year: true,
        monthly_allowance_baseline: true,
        monthly_savings_goal: true,
        created_at: true,
      },
    });

    const defaultCategories = await prisma.category.findMany({
      where: { is_default: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTransactions,
        categoriesCount,
        budgetsCount,
      },
      recentUsers,
      defaultCategories,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Lỗi tải thống kê admin." }, { status: 500 });
  }
}
