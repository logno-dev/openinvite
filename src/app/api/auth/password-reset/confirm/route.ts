import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { readStringFields } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await readStringFields(request, ["token", "password"]);
  if (!body) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
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
  const reset = await db.transaction(async (tx) => {
    const usedAt = new Date();
    const claimed = await tx
      .update(passwordResetTokens)
      .set({ usedAt })
      .where(and(
        eq(passwordResetTokens.id, resetRecord[0].id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, usedAt)
      ))
      .returning({ userId: passwordResetTokens.userId });
    if (claimed.length === 0) return false;

    const userId = claimed[0].userId;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    return true;
  });
  if (!reset) {
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
