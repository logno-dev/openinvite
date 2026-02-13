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
  let total = parseNumber(form.get("total")?.toString() || null);
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

  const invitationConfig = await db
    .select({ countMode: invitations.countMode })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (invitationConfig[0]?.countMode === "split") {
    total = adults + kids;
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

  const calendarToken = guestToken ?? openToken ?? "";
  const calendarLink = calendarToken
    ? `<a href="/api/calendar/${calendarToken}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;background:#00f0ff;color:#0a0a14;text-decoration:none;font-weight:600;">Add to calendar</a>`
    : "";
  const backLink = guestToken
    ? `<a href="/i/${guestToken}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.35);color:#fef7ff;text-decoration:none;font-weight:600;">Back to invitation</a>`
    : "";
  const thankYou = `<!doctype html><html><head><meta charset="utf-8"><title>RSVP received</title></head><body style="font-family: system-ui; padding: 40px; background: #0a0a14; color: #fef7ff; display:flex; align-items:center; justify-content:center; min-height:100vh;"><main style="text-align:center; max-width:520px; display:grid; gap:16px;"><h1 style="font-size:36px; margin:0;">RSVP received</h1><p style="margin:0; color:rgba(255,255,255,0.7);">Thanks${guestDisplayName ? ", " + guestDisplayName : ""}. You can return to update your response anytime.</p><div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">${calendarLink}${backLink}</div></main></body></html>`;
  return new NextResponse(thankYou, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
