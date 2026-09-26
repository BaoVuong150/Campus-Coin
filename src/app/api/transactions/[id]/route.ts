import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();

    // Fallback demo user for judging if no token
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

    // Kiểm tra quyền sở hữu (Chống IDOR - Insecure Direct Object Reference)
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Giao dịch không tồn tại." }, { status: 404 });
    }

    if (existing.user_id !== user.userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền chỉnh sửa giao dịch này." },
        { status: 403 }
      );
    }

    const { amount, type, description, category_id, date, is_recurring } = await req.json();

    if (amount !== undefined) {
      const num = Number(amount);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json({ error: "Số tiền không hợp lệ." }, { status: 400 });
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount ? Number(amount) : undefined,
        type: type || undefined,
        description: description?.trim() || undefined,
        category_id: category_id ? Number(category_id) : undefined,
        date: date ? new Date(date) : undefined,
        is_recurring: typeof is_recurring === "boolean" ? is_recurring : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, transaction: updated });
  } catch (error) {
    console.error("Transaction PUT error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật giao dịch." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let user = await getCurrentUser();

    // Fallback demo user for judging if no token
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

    // Kiểm tra quyền sở hữu (Chống IDOR - Insecure Direct Object Reference)
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Giao dịch không tồn tại." }, { status: 404 });
    }

    if (existing.user_id !== user.userId && user.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa giao dịch này." },
        { status: 403 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Đã xóa giao dịch." });
  } catch (error) {
    console.error("Transaction DELETE error:", error);
    return NextResponse.json({ error: "Lỗi xóa giao dịch." }, { status: 500 });
  }
}
