import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitationHosts, invitations } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type UpdateGuestGroupPayload = {
  displayName?: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  expectedAdults?: number;
  expectedKids?: number;
  expectedTotal?: number;
  openCount?: boolean;
};

export async function PATCH(
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

  const body = (await request.json()) as UpdateGuestGroupPayload;
  const update: Partial<typeof guestGroups.$inferInsert> = {};

  if (body.displayName !== undefined) {
    update.displayName = body.displayName.trim();
  }
  if (body.email !== undefined) {
    update.email = body.email?.trim() || null;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone?.trim() || null;
  }
  if (body.notes !== undefined) {
    update.notes = body.notes?.trim() || null;
  }
  if (body.expectedAdults !== undefined) {
    update.expectedAdults = Math.max(0, body.expectedAdults);
  }
  if (body.expectedKids !== undefined) {
    update.expectedKids = Math.max(0, body.expectedKids);
  }
  if (body.expectedTotal !== undefined) {
    update.expectedTotal = Math.max(0, body.expectedTotal);
  }
  if (body.openCount !== undefined) {
    update.openCount = body.openCount;
  }

  if (update.openCount) {
    const invitation = await db
      .select({ countMode: invitations.countMode })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);
    if (invitation.length === 0) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const adults = update.expectedAdults ?? 0;
    const kids = update.expectedKids ?? 0;
    const total = update.expectedTotal ?? adults + kids;
    const hasMinimum = invitation[0].countMode === "total" ? total >= 1 : adults + kids >= 1;
    if (!hasMinimum) {
      return NextResponse.json(
        {
          error:
            invitation[0].countMode === "total"
              ? "Open count requires expected total of at least 1"
              : "Open count requires at least 1 adult or child",
        },
        { status: 400 }
      );
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await db
    .update(guestGroups)
    .set(update)
    .where(and(eq(guestGroups.id, groupId), eq(guestGroups.invitationId, invitationId)));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
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

  await db
    .delete(guestGroups)
    .where(and(eq(guestGroups.id, groupId), eq(guestGroups.invitationId, invitationId)));

  return NextResponse.json({ ok: true });
}
