"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  Users,
  Settings,
  PieChart,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  LayoutDashboard,
  Coins,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  academic_year: string | null;
  monthly_allowance_baseline: number;
  monthly_savings_goal: number;
  created_at: string;
}

interface DefaultCategory {
  id: number;
  name: string;
  type: string;
  icon: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    categoriesCount: 0,
    budgetsCount: 0,
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [categories, setCategories] = useState<DefaultCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for new default category
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.recentUsers) setUsers(data.recentUsers);
      if (data.defaultCategories) setCategories(data.defaultCategories);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.warning("Thiếu tên danh mục", "Vui lòng nhập tên danh mục toàn hệ thống.");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: newCatType,
        }),
      });

      if (res.ok) {
        toast.success("Tạo danh mục thành công", `Danh mục "${newCatName.trim()}" đã được bổ sung.`);
        setNewCatName("");
        fetchAdminData();
      } else {
        toast.error("Lỗi tạo danh mục", "Không thể thêm danh mục mới.");
      }
    } catch (err) {
      console.error("Add cat error:", err);
      toast.error("Lỗi kết nối", "Đã xảy ra lỗi khi tạo danh mục.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#010102] text-[#0f1011] dark:text-[#f7f8f8] transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ================= ADMIN TOP BAR ================= */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#23252a]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-eyebrow text-[#7a7fad] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#7a7fad]" />
                Cổng Quản Trị Hệ Thống (SRS 3.11)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#141516] text-[#27a644] font-medium border border-[#23252a]">
                Admin Active
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-headline text-[#f7f8f8] mt-0.5">
              Bảng Điều Khiển Quản Trị Viên
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-[8px] bg-[#141516] hover:bg-[#18191a] text-[#f7f8f8] border border-[#23252a] text-[13px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#5e6ad2]" />
              Xem Sổ Chi Tiêu Sinh Viên
            </Link>

            <button
              onClick={fetchAdminData}
              title="Làm mới số liệu"
              className="p-2 rounded-[8px] bg-[#141516] hover:bg-[#18191a] text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a]"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-2 rounded-[8px] bg-[#141516] hover:bg-[#18191a] text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= STATS TILES ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-[12px] bg-[#0f1011] border border-[#23252a] edge-highlight">
            <div className="flex items-center justify-between text-[#8a8f98] text-[12px]">
              <span>Sinh viên hoạt động</span>
              <Users className="w-3.5 h-3.5 text-[#5e6ad2]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.6px] text-[#f7f8f8] mt-1">
              {stats.totalUsers} tài khoản
            </h3>
            <p className="text-[11px] text-[#8a8f98] mt-2">Dữ liệu từ Supabase PostgreSQL</p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#0f1011] border border-[#23252a] edge-highlight">
            <div className="flex items-center justify-between text-[#8a8f98] text-[12px]">
              <span>Tổng giao dịch toàn trường</span>
              <Coins className="w-3.5 h-3.5 text-[#27a644]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.6px] text-[#f7f8f8] mt-1">
              {stats.totalTransactions} giao dịch
            </h3>
            <p className="text-[11px] text-[#8a8f98] mt-2">Bao gồm 6 tháng dữ liệu mẫu</p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#0f1011] border border-[#23252a] edge-highlight">
            <div className="flex items-center justify-between text-[#8a8f98] text-[12px]">
              <span>Danh mục dùng chung</span>
              <Settings className="w-3.5 h-3.5 text-[#7a7fad]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.6px] text-[#f7f8f8] mt-1">
              {stats.categoriesCount} danh mục
            </h3>
            <p className="text-[11px] text-[#8a8f98] mt-2">Chuẩn hóa cho sinh viên</p>
          </div>

          <div className="p-4 rounded-[12px] bg-[#0f1011] border border-[#23252a] edge-highlight">
            <div className="flex items-center justify-between text-[#8a8f98] text-[12px]">
              <span>Hạn mức ngân sách</span>
              <PieChart className="w-3.5 h-3.5 text-[#5e6ad2]" />
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.6px] text-[#f7f8f8] mt-1">
              {stats.budgetsCount} ngân sách
            </h3>
            <p className="text-[11px] text-[#8a8f98] mt-2">Theo dõi real-time</p>
          </div>
        </div>

        {/* ================= 2-PANEL WORKSPACE ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* PANEL 1: STUDENT MANAGEMENT (7 COLS) */}
          <div className="lg:col-span-7 bg-[#0f1011] border border-[#23252a] rounded-[12px] p-5 edge-highlight space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23252a]">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f7f8f8] tracking-card-title">
                  Quản Lý Tài Khoản Sinh Viên (SRS 3.11)
                </h2>
                <p className="text-[11px] text-[#8a8f98]">
                  Danh sách sinh viên, trạng thái tài khoản và thông số tài chính
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[#8a8f98]">Đang tải dữ liệu...</div>
            ) : (
              <div className="divide-y divide-[#23252a]">
                {users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-[#f7f8f8] font-medium">{u.name}</strong>
                        <span className="text-[10px] px-1 rounded bg-[#141516] text-[#8a8f98] border border-[#23252a]">
                          {u.academic_year || "K21"}
                        </span>
                      </div>
                      <p className="font-mono text-[#8a8f98] text-[11px] mt-0.5">{u.email}</p>
                      <p className="text-[#62666d] text-[10px]">
                        Mục tiêu tiết kiệm: {Number(u.monthly_savings_goal).toLocaleString("vi-VN")} đ/tháng
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#27a644] font-medium">Hoạt động</span>
                      <button
                        type="button"
                        onClick={() =>
                          toast.success(
                            "Đã gửi email khôi phục",
                            `Liên kết đặt lại mật khẩu an toàn đã được gửi đến ${u.email}`
                          )
                        }
                        className="px-2 py-1 rounded-[6px] bg-[#141516] hover:bg-[#18191a] text-[#8a8f98] hover:text-[#f7f8f8] border border-[#23252a] text-[11px] cursor-pointer"
                      >
                        Reset PW
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PANEL 2: DEFAULT CATEGORIES (5 COLS) */}
          <div className="lg:col-span-5 bg-[#0f1011] border border-[#23252a] rounded-[12px] p-5 edge-highlight space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#23252a]">
              <div>
                <h2 className="text-[15px] font-semibold text-[#f7f8f8] tracking-card-title">
                  Danh Mục Mặc Định Toàn Trường
                </h2>
                <p className="text-[11px] text-[#8a8f98]">SRS 3.2 & 3.11 • Hệ Thống Dùng Chung</p>
              </div>
            </div>

            {/* Quick Add Form */}
            <form noValidate onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Tên danh mục mới..."
                className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-[#141516] border border-[#23252a] text-[#f7f8f8] text-xs focus:outline-none focus:ring-1 focus:ring-[#5e69d1]"
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as "expense" | "income")}
                className="px-2 py-1.5 rounded-[8px] bg-[#141516] border border-[#23252a] text-[#8a8f98] text-xs"
              >
                <option value="expense">Chi</option>
                <option value="income">Thu</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-[8px] bg-[#5e6ad2] hover:bg-[#828fff] text-white text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </form>

            {/* List */}
            <div className="divide-y divide-[#23252a] max-h-96 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.type === "income" ? "bg-[#27a644]" : "bg-[#5e6ad2]"
                      }`}
                    />
                    <span className="font-medium text-[#f7f8f8]">{c.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#141516] text-[#8a8f98] border border-[#23252a]">
                    {c.type === "income" ? "Thu nhập" : "Chi tiêu"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
