import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { hostInvites, invitationHosts } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invite = await db
    .select({
      id: hostInvites.id,
      invitationId: hostInvites.invitationId,
      usedAt: hostInvites.usedAt,
    })
    .from(hostInvites)
    .where(and(eq(hostInvites.token, token), isNull(hostInvites.usedAt)))
    .limit(1);

  if (invite.length === 0) {
    return NextResponse.json({ error: "Invite expired" }, { status: 404 });
  }

  const existing = await db
    .select({ id: invitationHosts.id })
    .from(invitationHosts)
    .where(
      and(
        eq(invitationHosts.invitationId, invite[0].invitationId),
        eq(invitationHosts.userId, user.id)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(invitationHosts).values({
      id: crypto.randomUUID(),
      invitationId: invite[0].invitationId,
      userId: user.id,
      role: "host",
      canEdit: true,
      notifyOnRsvp: true,
    });
  }

  await db
    .update(hostInvites)
    .set({
      usedAt: new Date(),
      usedByUserId: user.id,
    })
    .where(eq(hostInvites.id, invite[0].id));

  return NextResponse.json({ ok: true, invitationId: invite[0].invitationId });
}
