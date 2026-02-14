import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { linkGuestGroupToUserByToken } from "@/lib/guest-groups";
import { clearOpenClaimCookies, collectClaimGuestTokens } from "@/lib/respondent-claim";
import { createSession, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

type RegisterPayload = {
  email?: string;
  password?: string;
  displayName?: string;
  claimGuestToken?: string;
};

function isValidEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RegisterPayload;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const displayName = body.displayName?.trim() || null;
  const claimGuestToken = body.claimGuestToken?.trim() || null;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const id = crypto.randomUUID();

  await db.insert(users).values({
    id,
    email,
    passwordHash,
    displayName,
  });

  const claimTokens = collectClaimGuestTokens(request, claimGuestToken);
  for (const token of claimTokens) {
    await linkGuestGroupToUserByToken(id, token, {
      allowMergeWithExisting: true,
      userEmail: email,
    });
  }

  const { token, expiresAt } = await createSession(id);
  const response = NextResponse.json({
    ok: true,
    user: { id, email, displayName },
  });
  setSessionCookie(response, token, expiresAt);
  clearOpenClaimCookies(request, response);
  return response;
}
