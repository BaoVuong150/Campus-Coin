import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Lấy thông tin hồ sơ và định mức lương/trợ cấp ngày 5 hàng tháng
export async function GET() {
  try {
    const realUser = await getCurrentUser();
    let user = realUser;

    // Fallback sang tài khoản sinh viên mẫu nếu chưa đăng nhập token
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

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        academic_year: true,
        monthly_allowance_baseline: true,
        monthly_savings_goal: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    // Mặc định 8,000,000 VND nếu chưa cấu hình hoặc bằng 0
    const allowance = Number(userData.monthly_allowance_baseline) || 8000000;
    const savingsGoal = Number(userData.monthly_savings_goal) || 1500000;

    return NextResponse.json({
      is_authenticated: !!realUser,
      user: {
        ...userData,
        monthly_allowance_baseline: allowance,
        monthly_savings_goal: savingsGoal,
      },
    });
  } catch (err) {
    console.error("GET user profile error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ." }, { status: 500 });
  }
}

// Cập nhật mức lương / trợ cấp hàng tháng (ví dụ tùy chỉnh 8tr, 8.5tr, ...)
export async function PATCH(req: Request) {
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

    const { monthly_allowance_baseline, monthly_savings_goal } = await req.json();

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        ...(monthly_allowance_baseline !== undefined && {
          monthly_allowance_baseline: Number(monthly_allowance_baseline),
        }),
        ...(monthly_savings_goal !== undefined && {
          monthly_savings_goal: Number(monthly_savings_goal),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        monthly_allowance_baseline: Number(updated.monthly_allowance_baseline),
        monthly_savings_goal: Number(updated.monthly_savings_goal),
      },
    });
  } catch (err) {
    console.error("PATCH user profile error:", err);
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ." }, { status: 500 });
  }
}
