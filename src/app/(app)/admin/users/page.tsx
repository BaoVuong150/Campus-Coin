"use client";

import { useState } from "react";
import { Search, UserX } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { useSessionUser } from "@/components/layout/session-context";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useAdminMutations, useAdminUsers, type AdminUserDTO } from "@/hooks/use-admin";
import { useDebounce } from "@/hooks/use-debounce";
import { errorMessage } from "@/lib/api-client";
import { formatDate, relativeDay } from "@/lib/utils/date";
import { formatNumber } from "@/lib/utils/money";

function UserActions({ user }: { user: AdminUserDTO }) {
  const me = useSessionUser();
  const { updateUser } = useAdminMutations();
  const { toast, confirm } = useToast();
  const [busy, setBusy] = useState(false);
  const self = me.id === user.id;

  const run = async (input: { is_active?: boolean; role?: "student" | "admin" }, ask: { title: string; message: string; confirmText: string; destructive?: boolean }, done: string) => {
    const ok = await confirm({ ...ask, isDestructive: ask.destructive });
    if (!ok) return;
    setBusy(true);
    try {
      await updateUser(user.id, input);
      toast.success(done);
    } catch (e) {
      toast.error("Không thể cập nhật người dùng", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (self) return <span className="text-[12px] text-subtle">Tài khoản của bạn</span>;

  return (
    <div className="flex justify-end gap-1.5">
      {user.isActive ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() =>
            run(
              { is_active: false },
              { title: "Vô hiệu hóa tài khoản?", message: `${user.name} sẽ bị đăng xuất và không thể đăng nhập cho đến khi được kích hoạt lại. Dữ liệu vẫn được giữ nguyên.`, confirmText: "Vô hiệu hóa", destructive: true },
              "Đã vô hiệu hóa tài khoản"
            )
          }
        >
          Vô hiệu hóa
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => run({ is_active: true }, { title: "Kích hoạt lại tài khoản?", message: `${user.name} sẽ có thể đăng nhập trở lại.`, confirmText: "Kích hoạt" }, "Đã kích hoạt tài khoản")}>
          Kích hoạt
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        onClick={() =>
          run(
            { role: user.role === "admin" ? "student" : "admin" },
            {
              title: user.role === "admin" ? "Gỡ quyền quản trị?" : "Cấp quyền quản trị?",
              message: user.role === "admin" ? `${user.name} sẽ trở thành tài khoản sinh viên.` : `${user.name} sẽ có toàn quyền quản trị hệ thống.`,
              confirmText: "Xác nhận",
              destructive: user.role !== "admin",
            },
            "Đã đổi vai trò"
          )
        }
      >
        {user.role === "admin" ? "Gỡ admin" : "Cấp admin"}
      </Button>
    </div>
  );
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(q.trim(), 300);
  const { data, error, reload } = useAdminUsers(debounced, status, page);

  return (
    <div>
      <PageHeader title="Người dùng" description="Xem, vô hiệu hóa tài khoản và phân quyền. Mật khẩu và token không bao giờ được hiển thị." />
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên hoặc email"
            aria-label="Tìm người dùng"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Lọc trạng thái"
          className="sm:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="disabled">Đã vô hiệu hóa</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <div className="px-5">
            <SkeletonRows rows={6} />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<UserX />} title="Không tìm thấy người dùng" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-left text-[12px] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Người dùng</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Vai trò</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Trạng thái</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Giao dịch</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Đăng nhập gần nhất</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={u.name} className="size-8 text-[11px]" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{u.name}</span>
                          <span className="block truncate text-[12px] text-subtle">
                            {u.email} · tạo {formatDate(u.createdAt)}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={u.role === "admin" ? "info" : "neutral"}>{u.role === "admin" ? "Admin" : "Sinh viên"}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Hoạt động" : "Vô hiệu hóa"}</Badge>
                    </td>
                    <td className="tabular px-3 py-3 text-muted">{formatNumber(u.transactionCount)}</td>
                    <td className="px-3 py-3 text-muted">{u.lastLoginAt ? relativeDay(u.lastLoginAt) : "—"}</td>
                    <td className="px-5 py-3">
                      <UserActions user={u} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.total > 0 && (
          <div className="border-t border-border px-5 py-3">
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
          </div>
        )}
      </Card>
    </div>
  );
}
