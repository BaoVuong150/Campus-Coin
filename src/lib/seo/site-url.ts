/** URL công khai của site (APP_URL) dùng cho metadataBase, robots, sitemap; dev không cấu hình thì dùng localhost. */
export function siteUrl(): string {
  return (process.env.APP_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
}
