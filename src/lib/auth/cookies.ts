import type { NextResponse } from "next/server";
import { isProduction } from "@/lib/env";
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./jwt";

const baseCookie = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, { ...baseCookie, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...baseCookie, maxAge: 0 });
}
