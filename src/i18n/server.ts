import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getMessages } from "./index";

/** Ngôn ngữ của request: cookie người dùng chọn → Accept-Language của trình duyệt → tiếng Việt. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language")?.toLowerCase() ?? "";
  const primary = accept.split(",")[0]?.trim() ?? "";
  return primary.startsWith("en") ? "en" : DEFAULT_LOCALE;
}

export async function getServerMessages() {
  return getMessages(await getLocale());
}
