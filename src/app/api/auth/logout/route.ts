import { ok } from "@/lib/api/response";
import { clearSessionCookie } from "@/lib/auth/cookies";

export async function POST() {
  const response = ok({ loggedOut: true });
  clearSessionCookie(response);
  return response;
}
