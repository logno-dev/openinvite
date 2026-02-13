import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitationDetails, invitations } from "@/db/schema";
import { buildIcs } from "@/lib/ics";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let invitationId: string | null = null;

  const guest = await db
    .select({ invitationId: guestGroups.invitationId })
    .from(guestGroups)
    .where(eq(guestGroups.token, token))
    .limit(1);

  if (guest.length > 0) {
    invitationId = guest[0].invitationId;
  } else {
    const open = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.openRsvpToken, token))
      .limit(1);
    if (open.length > 0) {
      invitationId = open[0].id;
    }
  }

  if (!invitationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invite = await db
    .select({
      title: invitations.title,
      timezone: invitations.timezone,
    })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  const details = await db
    .select()
    .from(invitationDetails)
    .where(eq(invitationDetails.invitationId, invitationId))
    .limit(1);

  if (invite.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const eventDate = details[0]?.eventDate ?? null;
  const eventTime = details[0]?.eventTime ?? null;
  const ics = buildIcs({
    title: invite[0].title,
    locationName: details[0]?.locationName ?? null,
    address: details[0]?.address ?? null,
    notes: details[0]?.notes ?? null,
    eventDate,
    eventTime,
    timezone: invite[0].timezone,
    uid: `${invitationId}-${token}`,
  });

  if (!ics) {
    return NextResponse.json({ error: "Event date missing" }, { status: 400 });
  }

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=invite-${invitationId}.ics`,
    },
  });
}
