import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestGroups,
  invitationHosts,
  invitations,
  rsvpOptions,
  rsvpResponses,
} from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type ResponsePayload = {
  optionKey?: string;
  adults?: number;
  kids?: number;
  total?: number;
  message?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string; groupId: string }> }
) {
  const { invitationId, groupId } = await params;
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
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await request.json()) as ResponsePayload;
  const optionKey = body.optionKey ?? "";
  if (!optionKey) {
    return NextResponse.json({ error: "Response required" }, { status: 400 });
  }

  const optionExists = await db
    .select({ key: rsvpOptions.key })
    .from(rsvpOptions)
    .where(
      and(eq(rsvpOptions.invitationId, invitationId), eq(rsvpOptions.key, optionKey))
    )
    .limit(1);

  if (optionExists.length === 0) {
    return NextResponse.json({ error: "Invalid response option" }, { status: 400 });
  }

  const invite = await db
    .select({ countMode: invitations.countMode })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  const countMode = invite[0]?.countMode === "total" ? "total" : "split";
  const adults = Math.max(0, body.adults ?? 0);
  const kids = Math.max(0, body.kids ?? 0);
  const total =
    countMode === "total" ? Math.max(0, body.total ?? 0) : adults + kids;
  const message = body.message?.trim() || null;

  const group = await db
    .select({ id: guestGroups.id })
    .from(guestGroups)
    .where(and(eq(guestGroups.id, groupId), eq(guestGroups.invitationId, invitationId)))
    .limit(1);

  if (group.length === 0) {
    return NextResponse.json({ error: "Guest group not found" }, { status: 404 });
  }

  await db.delete(rsvpResponses).where(eq(rsvpResponses.groupId, groupId));

  await db.insert(rsvpResponses).values({
    id: crypto.randomUUID(),
    groupId,
    optionKey,
    adults,
    kids,
    total,
    message,
    respondedByUserId: user.id,
  });

  return NextResponse.json({ ok: true });
}
