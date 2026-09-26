import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    // Lấy các danh mục mặc định toàn trường và danh mục riêng của sinh viên (nếu đã đăng nhập)
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { is_default: true },
          ...(user ? [{ user_id: user.userId }] : []),
        ],
      },
      orderBy: [{ is_default: "desc" }, { name: "asc" }],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Lỗi tải danh mục." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }

    const { name, type, icon, color } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "Tên và loại danh mục là bắt buộc." }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        icon: icon || "Tag",
        color: color || "#5e6ad2",
        is_default: false,
        user_id: user.userId,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Categories POST error:", error);
    return NextResponse.json({ error: "Lỗi tạo danh mục mới." }, { status: 500 });
  }
}
