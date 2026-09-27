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
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
    }

    const allowance = Number(userData.monthly_allowance_baseline) || 8000000;
    const savingsGoal = Number(userData.monthly_savings_goal) || 1500000;
    let salaryPayDay = 5;
    let fixedBills = null;

    try {
      const extraRows = await prisma.$queryRaw<Array<{ salary_pay_day: number | null; fixed_bills: unknown }>>`
        SELECT salary_pay_day, fixed_bills FROM "users" WHERE id = ${user.userId} LIMIT 1
      `;
      if (extraRows && extraRows.length > 0) {
        if (extraRows[0].salary_pay_day != null) {
          salaryPayDay = Number(extraRows[0].salary_pay_day);
        }
        if (extraRows[0].fixed_bills) {
          const rawBills = extraRows[0].fixed_bills;
          if (Array.isArray(rawBills)) {
            // Đảm bảo category_id của chi phí cố định luôn thuộc nhóm Chi phí (expense >= 6)
            fixedBills = rawBills.map((b: Record<string, unknown>) => {
              let catId = Number(b.category_id);
              if (!catId || catId <= 5) {
                const lower = String(b.name || "").toLowerCase();
                if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
                  catId = 8; // Tiền trọ / KTX
                } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
                  catId = 10; // Dịch vụ số
                } else {
                  catId = 12; // Chi tiêu khác
                }
              }
              return { ...b, category_id: catId };
            });
          } else {
            fixedBills = rawBills;
          }
        }
      }
    } catch (rawErr) {
      console.warn("Could not query extra user fields via raw SQL:", rawErr);
    }

    return NextResponse.json({
      is_authenticated: true,
      user: {
        ...userData,
        monthly_allowance_baseline: allowance,
        monthly_savings_goal: savingsGoal,
        salary_pay_day: salaryPayDay,
        fixed_bills: fixedBills,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("GET user profile error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ.", details: errorMsg }, { status: 500 });
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

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
    });

    let sDay = 5;
    let fBills = fixed_bills;

    if (Array.isArray(fixed_bills)) {
      // Đảm bảo category_id luôn là chi phí (>= 6)
      fBills = fixed_bills.map((b: Record<string, unknown>) => {
        let catId = Number(b.category_id);
        if (!catId || catId <= 5) {
          const lower = String(b.name || "").toLowerCase();
          if (lower.includes("trọ") || lower.includes("ktx") || lower.includes("ký túc") || lower.includes("phòng") || lower.includes("điện") || lower.includes("nước") || lower.includes("wifi")) {
            catId = 8;
          } else if (lower.includes("4g") || lower.includes("net") || lower.includes("cước") || lower.includes("sim") || lower.includes("antigravity") || lower.includes("dịch vụ")) {
            catId = 10;
          } else {
            catId = 12;
          }
        }
        return { ...b, category_id: catId };
      });
    }

    if (salary_pay_day !== undefined || fixed_bills !== undefined) {
      try {
        sDay = salary_pay_day !== undefined ? Number(salary_pay_day) : 5;
        const billsJson = fBills !== undefined ? JSON.stringify(fBills) : null;
        await prisma.$executeRaw`
          UPDATE "users" 
          SET salary_pay_day = ${sDay}, fixed_bills = ${billsJson}::jsonb
          WHERE id = ${user.userId}
        `;
      } catch (rawErr) {
        console.warn("Could not update extra user fields via raw SQL:", rawErr);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        monthly_allowance_baseline: Number(updated.monthly_allowance_baseline),
        monthly_savings_goal: Number(updated.monthly_savings_goal),
        salary_pay_day: sDay,
        fixed_bills: fBills,
      },
    });
  } catch (err) {
    console.error("PATCH user profile error:", err);
    return NextResponse.json({ error: "Không thể cập nhật hồ sơ." }, { status: 500 });
  }
}
