import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { linkGuestGroupToUserByToken } from "@/lib/guest-groups";
import { createSession, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

type LoginPayload = {
  email?: string;
  password?: string;
  claimGuestToken?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as LoginPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const claimGuestToken = body.claimGuestToken?.trim() || null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = await db
    .select({ id: users.id, passwordHash: users.passwordHash, displayName: users.displayName })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const user = existing[0];
  const valid = await verifyPassword(user.passwordHash, password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (claimGuestToken) {
    await linkGuestGroupToUserByToken(user.id, claimGuestToken, {
      allowMergeWithExisting: true,
    });
  }

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email,
      displayName: user.displayName,
    },
  });
  setSessionCookie(response, token, expiresAt);
  return response;
}
