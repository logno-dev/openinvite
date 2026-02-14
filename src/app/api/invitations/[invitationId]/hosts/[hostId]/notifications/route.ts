import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationHosts } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type Payload = {
  notifyOnRsvp?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string; hostId: string }> }
) {
  const { invitationId, hostId } = await params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed = await db
    .select({ id: invitationHosts.id })
    .from(invitationHosts)
    .where(
      and(
        eq(invitationHosts.invitationId, invitationId),
        eq(invitationHosts.userId, user.id)
      )
    )
    .limit(1);
  if (allowed.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as Payload;
  if (body.notifyOnRsvp === undefined) {
    return NextResponse.json({ error: "notifyOnRsvp required" }, { status: 400 });
  }

  await db
    .update(invitationHosts)
    .set({ notifyOnRsvp: body.notifyOnRsvp })
    .where(and(eq(invitationHosts.id, hostId), eq(invitationHosts.invitationId, invitationId)));

  return NextResponse.json({ ok: true });
}
