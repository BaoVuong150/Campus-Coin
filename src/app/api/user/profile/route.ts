import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Lấy thông tin hồ sơ và định mức lương/trợ cấp ngày 5 hàng tháng
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        academic_year: true,
        monthly_allowance_baseline: true,
        monthly_savings_goal: true,
        salary_pay_day: true,
        fixed_bills: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const allowance = Number(userData.monthly_allowance_baseline) || 8000000;
    const savingsGoal = Number(userData.monthly_savings_goal) || 1500000;
    const salaryPayDay = userData.salary_pay_day || 5;

    return NextResponse.json({
      is_authenticated: true,
      user: {
        ...userData,
        monthly_allowance_baseline: allowance,
        monthly_savings_goal: savingsGoal,
        salary_pay_day: salaryPayDay,
        fixed_bills: userData.fixed_bills || null,
      },
    });
  } catch (err) {
    console.error("GET user profile error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ." }, { status: 500 });
  }
}

// Cập nhật mức lương / trợ cấp hàng tháng và chi phí cố định
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const {
      monthly_allowance_baseline,
      monthly_savings_goal,
      salary_pay_day,
      fixed_bills,
    } = await req.json();

    const updateData: Record<string, unknown> = {};
    if (monthly_allowance_baseline !== undefined) {
      updateData.monthly_allowance_baseline = Number(monthly_allowance_baseline);
    }
    if (monthly_savings_goal !== undefined) {
      updateData.monthly_savings_goal = Number(monthly_savings_goal);
    }
    if (salary_pay_day !== undefined) {
      updateData.salary_pay_day = Number(salary_pay_day);
    }
    if (fixed_bills !== undefined) {
      updateData.fixed_bills = fixed_bills;
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        monthly_allowance_baseline: Number(updated.monthly_allowance_baseline),
        monthly_savings_goal: Number(updated.monthly_savings_goal),
        salary_pay_day: updated.salary_pay_day || 5,
        fixed_bills: updated.fixed_bills,
      },
    });
  } catch (err) {
    console.error("PATCH user profile error:", err);
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ." }, { status: 500 });
  }
}
