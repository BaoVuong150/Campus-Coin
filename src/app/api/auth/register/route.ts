import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const {
      name,
      email,
      password,
      academic_year,
      monthly_allowance_baseline,
      monthly_savings_goal,
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền họ tên, email và mật khẩu." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác." },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        role: "student",
        academic_year: academic_year || "Năm 2 (2024 - 2028)",
        monthly_allowance_baseline: monthly_allowance_baseline ? Number(monthly_allowance_baseline) : 3500000,
        monthly_savings_goal: monthly_savings_goal ? Number(monthly_savings_goal) : 1000000,
      },
    });

    const token = signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });

    response.cookies.set("campuscoin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ khi đăng ký tài khoản." },
      { status: 500 }
    );
  }
}
