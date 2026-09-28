"use client";

import { logout } from "@/components/layout/user-menu";

/** Nút đăng xuất dạng liên kết cho các trang ngoài khung app (ví dụ trang bắt buộc đổi mật khẩu). */
export function LogoutLink({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => void logout()} className="font-medium text-primary-ink hover:underline">
      {label}
    </button>
  );
}
