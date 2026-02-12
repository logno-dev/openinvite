import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitations, rsvpOptions, rsvpResponses } from "@/db/schema";

export const runtime = "nodejs";

function parseNumber(value: string | null) {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
}

async function findOption(invitationId: string, key: string) {
  const options = await db
    .select({ key: rsvpOptions.key })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, invitationId));
  return options.some((opt) => opt.key === key);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const guestToken = form.get("guestToken")?.toString() || null;
  const openToken = form.get("openToken")?.toString() || null;
  const responseKey = form.get("response")?.toString() || "";
  const adults = parseNumber(form.get("adults")?.toString() || null);
  const kids = parseNumber(form.get("kids")?.toString() || null);
  const total = parseNumber(form.get("total")?.toString() || null);
  const message = form.get("message")?.toString().trim() || null;

  if (!responseKey) {
    return NextResponse.json({ error: "Response required" }, { status: 400 });
  }

  let groupId: string | null = null;
  let invitationId: string | null = null;
  let guestDisplayName: string | null = null;

  if (guestToken) {
    const group = await db
      .select({
        id: guestGroups.id,
        invitationId: guestGroups.invitationId,
        displayName: guestGroups.displayName,
      })
      .from(guestGroups)
      .where(eq(guestGroups.token, guestToken))
      .limit(1);

    if (group.length === 0) {
      return NextResponse.json({ error: "Invalid guest token" }, { status: 404 });
    }

    groupId = group[0].id;
    invitationId = group[0].invitationId;
    guestDisplayName = group[0].displayName;
  } else if (openToken) {
    const invitation = await db
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.openRsvpToken, openToken))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({ error: "Invalid open token" }, { status: 404 });
    }

    invitationId = invitation[0].id;
    guestDisplayName = form.get("guestName")?.toString().trim() || "Guest";

    const newGroupId = crypto.randomUUID();
    await db.insert(guestGroups).values({
      id: newGroupId,
      invitationId,
      displayName: guestDisplayName,
      token: crypto.randomUUID(),
      expectedAdults: adults,
      expectedKids: kids,
      expectedTotal: total,
      openCount: true,
      notes: null,
    });

    groupId = newGroupId;
  } else {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (!invitationId || !groupId) {
    return NextResponse.json({ error: "Invalid RSVP" }, { status: 400 });
  }

  const validOption = await findOption(invitationId, responseKey);
  if (!validOption) {
    return NextResponse.json({ error: "Invalid response option" }, { status: 400 });
  }

  await db.insert(rsvpResponses).values({
    id: crypto.randomUUID(),
    groupId,
    optionKey: responseKey,
    adults,
    kids,
    total,
    message,
    respondedByUserId: null,
  });

  const thankYou = `<!doctype html><html><head><meta charset="utf-8"><title>RSVP received</title></head><body style="font-family: sans-serif; padding: 40px; background: #0a0a14; color: #fef7ff;"><h1>RSVP received</h1><p>Thanks${guestDisplayName ? ", " + guestDisplayName : ""}. You can return to update your response anytime.</p></body></html>`;
  return new NextResponse(thankYou, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
