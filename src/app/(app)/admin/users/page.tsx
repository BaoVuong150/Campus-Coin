"use client";

import { useState } from "react";
import { Copy, Download, KeyRound, Search, UserX } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { PageHeader } from "@/components/layout/page-header";
import { useSessionUser } from "@/components/layout/session-context";
import { Avatar } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Select } from "@/components/ui/field";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useAdminMutations, useAdminUsers, type AdminUserDTO } from "@/hooks/use-admin";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDate } from "@/lib/utils/date";
import { useI18n } from "@/i18n/provider";
import { formatNumber } from "@/lib/utils/money";

/** Hiển thị mật khẩu tạm đúng một lần; đóng dialog là xóa khỏi bộ nhớ. */
function TemporaryPasswordDialog({ user, password, onClose }: { user: AdminUserDTO; password: string | null; onClose: () => void }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const l = t.admin.users;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password ?? "");
      toast.success(l.copied);
    } catch {
      // Trình duyệt chặn clipboard: admin vẫn có thể chọn và sao chép thủ công.
    }
  };
  return (
    <Dialog
      open={password !== null}
      onClose={onClose}
      size="sm"
      title={l.resetDoneTitle}
      footer={
        <>
          <Button variant="outline" onClick={copy}>
            <Copy className="size-4" aria-hidden /> {l.copy}
          </Button>
          <Button onClick={onClose} data-autofocus>
            {l.close}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{l.resetDoneMessage(user.name)}</p>
      <p className="tabular mt-3 rounded-md border border-border bg-surface-secondary px-3 py-2.5 text-center font-mono text-lg tracking-wider text-foreground select-all">
        {password}
      </p>
    </Dialog>
  );
}

function UserActions({ user }: { user: AdminUserDTO }) {
  const me = useSessionUser();
  const { updateUser, resetPassword } = useAdminMutations();
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const { toast, confirm } = useToast();
  const { t, fmt } = useI18n();
  const l = t.admin.users;
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
      toast.error(l.failed, fmt.error(e));
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    const ok = await confirm({ title: l.resetTitle, message: l.resetMessage(user.name), confirmText: l.resetConfirm, isDestructive: true });
    if (!ok) return;
    setBusy(true);
    try {
      const result = await resetPassword(user.id);
      setTemporaryPassword(result.temporaryPassword);
    } catch (e) {
      toast.error(l.resetFailed, fmt.error(e));
    } finally {
      setBusy(false);
    }
  };

  if (self) return <span className="text-[12px] text-subtle">{l.you}</span>;

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
              { title: l.disableTitle, message: l.disableMessage(user.name), confirmText: l.disable, destructive: true },
              l.disabledToast
            )
          }
        >
          {l.disable}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => run({ is_active: true }, { title: l.enableTitle, message: l.enableMessage(user.name), confirmText: l.enable }, l.enabledToast)}
        >
          {l.enable}
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
              title: user.role === "admin" ? l.removeAdminTitle : l.makeAdminTitle,
              message: user.role === "admin" ? l.removeAdminMessage(user.name) : l.makeAdminMessage(user.name),
              confirmText: t.common.confirm,
              destructive: user.role !== "admin",
            },
            l.roleToast
          )
        }
      >
        {user.role === "admin" ? l.removeAdmin : l.makeAdmin}
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={reset} aria-label={`${l.resetPassword} – ${user.name}`} title={l.resetPassword}>
        <KeyRound className="size-4" aria-hidden />
      </Button>
      <TemporaryPasswordDialog user={user} password={temporaryPassword} onClose={() => setTemporaryPassword(null)} />
    </div>
  );
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const debounced = useDebounce(q.trim(), 300);
  const { data, error, reload } = useAdminUsers(debounced, status, page);
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.admin.users;

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/users/export");
      if (!res.ok) {
        throw new Error("Không thể tải xuống danh sách người dùng.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campuscoin_users_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Xuất danh sách người dùng thành công!");
    } catch (err: unknown) {
      toast.error("Xuất CSV thất bại", err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t.nav.adminUsers}
        description={l.description}
        actions={
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="size-4" aria-hidden />
            {isExporting ? "Đang xuất..." : "Xuất danh sách (CSV)"}
          </Button>
        }
      />
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
            placeholder={l.search}
            aria-label={l.searchLabel}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label={l.statusFilter}
          className="sm:w-48"
        >
          <option value="all">{l.allStatuses}</option>
          <option value="active">{l.active}</option>
          <option value="disabled">{l.disabled}</option>
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
          <EmptyState icon={<UserX />} title={l.notFound} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-left text-[12px] text-muted">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">{t.admin.user}</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">{t.admin.role}</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">{l.status}</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">{t.admin.transactions}</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">{l.lastLogin}</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">{l.actions}</th>
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
                            {u.email} · {l.createdOn(formatDate(u.createdAt))}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={u.role === "admin" ? "info" : "neutral"}>{t.admin.roles[u.role]}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? l.activeBadge : l.disabledBadge}</Badge>
                    </td>
                    <td className="tabular px-3 py-3 text-muted">{formatNumber(u.transactionCount)}</td>
                    <td className="px-3 py-3 text-muted">{u.lastLoginAt ? fmt.relativeDay(u.lastLoginAt) : "—"}</td>
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
