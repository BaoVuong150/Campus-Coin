import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const demoStudent = await prisma.user.findUnique({
        where: { email: "student@campuscoin.edu" },
      });
      if (demoStudent) {
        user = {
          userId: demoStudent.id,
          email: demoStudent.email,
          role: demoStudent.role,
          name: demoStudent.name,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || "2026-09";

    // 1. Lấy danh sách ngân sách đã thiết lập cho tháng này
    const budgets = await prisma.budget.findMany({
      where: {
        user_id: user.userId,
        month,
      },
      include: {
        category: true,
      },
    });

    // 2. Lấy tổng chi tiêu thực tế của tháng đó để so sánh Budget vs Actual
    const [year, m] = month.split("-").map(Number);
    const startOfMonth = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: user.userId,
        type: "expense",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Tính tổng chi tiêu theo từng category
    const spentByCategory: Record<number, number> = {};
    transactions.forEach((tx) => {
      spentByCategory[tx.category_id] = (spentByCategory[tx.category_id] || 0) + Number(tx.amount);
    });

    const budgetStatus = budgets.map((b) => {
      const spent = spentByCategory[b.category_id] || 0;
      const limit = Number(b.limit_amount);
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      let status = "normal";
      if (percentage >= 100) {
        status = "exceeded"; // Vượt trần ngân sách
      } else if (percentage >= 80) {
        status = "warning"; // Chạm ngưỡng 80%
      }

      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: b.category.name,
        icon: b.category.icon,
        limit,
        spent,
        remaining: Math.max(0, limit - spent),
        percentage,
        status,
      };
    });

    return NextResponse.json({ budgets: budgetStatus, month });
  } catch (error) {
    console.error("Budgets GET error:", error);
    return NextResponse.json({ error: "Lỗi tải ngân sách." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const demoStudent = await prisma.user.findUnique({
        where: { email: "student@campuscoin.edu" },
      });
      if (demoStudent) {
        user = {
          userId: demoStudent.id,
          email: demoStudent.email,
          role: demoStudent.role,
          name: demoStudent.name,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { category_id, month, limit_amount } = await req.json();

    const budget = await prisma.budget.upsert({
      where: {
        user_id_category_id_month: {
          user_id: user.userId,
          category_id: Number(category_id),
          month: month || "2026-09",
        },
      },
      update: {
        limit_amount: Number(limit_amount),
      },
      create: {
        user_id: user.userId,
        category_id: Number(category_id),
        month: month || "2026-09",
        limit_amount: Number(limit_amount),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({ success: true, budget });
  } catch (error) {
    console.error("Budgets POST error:", error);
    return NextResponse.json({ error: "Lỗi lưu hạn mức ngân sách." }, { status: 500 });
  }
}
