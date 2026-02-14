import type { NextRequest, NextResponse } from "next/server";

export function collectClaimGuestTokens(
  request: NextRequest,
  explicitToken?: string | null
) {
  const tokens = new Set<string>();
  const normalized = explicitToken?.trim();
  if (normalized) {
    tokens.add(normalized);
  }

  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("oi_open_")) continue;
    const token = cookie.value?.trim();
    if (!token) continue;
    tokens.add(token);
  }

  return Array.from(tokens);
}

export function clearOpenClaimCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("oi_open_")) continue;
    response.cookies.set({
      name: cookie.name,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
