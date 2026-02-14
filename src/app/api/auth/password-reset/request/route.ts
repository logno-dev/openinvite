import { NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { passwordResetTokens, users } from "@/db/schema";
import { getAppUrl, isMailerConfigured, sendMail } from "@/lib/mailer";

export const runtime = "nodejs";

type RequestPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RequestPayload;
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const user = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

  await db
    .delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, user[0].id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      )
    );

  await db.insert(passwordResetTokens).values({
    id: crypto.randomUUID(),
    userId: user[0].id,
    token,
    expiresAt,
  });

  if (isMailerConfigured()) {
    const resetUrl = `${getAppUrl()}/auth/reset-password/${encodeURIComponent(token)}`;
    await sendMail({
      to: user[0].email,
      subject: "Reset your OpenInvite password",
      html: `<p>We received a request to reset your OpenInvite password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
      text: `We received a request to reset your OpenInvite password.\n\nReset password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  }

  return NextResponse.json({ ok: true });
}
