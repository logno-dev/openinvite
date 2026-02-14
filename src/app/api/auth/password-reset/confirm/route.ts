import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

type ConfirmPayload = {
  token?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ConfirmPayload;
  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const resetRecord = await db
    .select({ id: passwordResetTokens.id, userId: passwordResetTokens.userId })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  if (resetRecord.length === 0) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const usedAt = new Date();

  await db.update(users).set({ passwordHash }).where(eq(users.id, resetRecord[0].userId));
  await db
    .update(passwordResetTokens)
    .set({ usedAt })
    .where(eq(passwordResetTokens.id, resetRecord[0].id));
  await db.delete(sessions).where(eq(sessions.userId, resetRecord[0].userId));

  return NextResponse.json({ ok: true });
}
