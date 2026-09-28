/**
 * Chống IDOR: tài nguyên phải thuộc về user hiện tại. Ném lỗi 404 (không phải 403)
 * để không tiết lộ việc dữ liệu của người khác có tồn tại.
 */
export function assertResourceOwner<T extends { user_id: string | null }>(
  resource: T | null | undefined,
  userId: string,
  notFound: () => Error
): asserts resource is T {
  if (!resource || resource.user_id !== userId) throw notFound();
}
