import type { Locale } from "./config";
import { en } from "./messages/en";
import { vi, type Messages } from "./messages/vi";

export type { Messages };

const DICTIONARIES: Record<Locale, Messages> = { vi, en };

export function getMessages(locale: Locale): Messages {
  return DICTIONARIES[locale];
}
