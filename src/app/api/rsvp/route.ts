import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitations, rsvpOptions, rsvpResponses } from "@/db/schema";
import { linkGuestGroupToUserByToken } from "@/lib/guest-groups";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const sessionUser = sessionToken
    ? await getSessionUserByToken(sessionToken)
    : null;
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
  let guestGroupToken: string | null = null;

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
    guestGroupToken = guestToken;

    if (sessionUser) {
      await linkGuestGroupToUserByToken(sessionUser.id, guestToken);
    }
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

    if (sessionUser) {
      const existingLinkedGroup = await db
        .select({
          id: guestGroups.id,
          token: guestGroups.token,
        })
        .from(guestGroups)
        .where(
          and(
            eq(guestGroups.invitationId, invitationId),
            eq(guestGroups.respondentUserId, sessionUser.id)
          )
        )
        .limit(1);

      if (existingLinkedGroup.length > 0) {
        await db
          .update(guestGroups)
          .set({
            displayName: guestDisplayName,
            expectedAdults: adults,
            expectedKids: kids,
            expectedTotal: total,
            openCount: true,
          })
          .where(eq(guestGroups.id, existingLinkedGroup[0].id));

        groupId = existingLinkedGroup[0].id;
        guestGroupToken = existingLinkedGroup[0].token;
      }
    }

    if (!groupId || !guestGroupToken) {
      const newGroupId = crypto.randomUUID();
      const newGroupToken = crypto.randomUUID();
      await db.insert(guestGroups).values({
        id: newGroupId,
        invitationId,
        displayName: guestDisplayName,
        token: newGroupToken,
        expectedAdults: adults,
        expectedKids: kids,
        expectedTotal: total,
        openCount: true,
        respondentUserId: sessionUser?.id ?? null,
        notes: null,
      });

      groupId = newGroupId;
      guestGroupToken = newGroupToken;
    }
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

  await db.delete(rsvpResponses).where(eq(rsvpResponses.groupId, groupId));

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
  const privateLink = guestGroupToken
    ? `<a href="/i/${guestGroupToken}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;background:#fef7ff;color:#0a0a14;text-decoration:none;font-weight:600;">Your private link</a>`
    : "";
  const accountLink = guestGroupToken
    ? `<a href="/auth?next=/my-invitations&claimGuestToken=${encodeURIComponent(guestGroupToken)}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.35);color:#fef7ff;text-decoration:none;font-weight:600;">Create account to manage RSVP</a>`
    : "";
  const backLink = guestToken
    ? `<a href="/i/${guestToken}" style="display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;border:1px solid rgba(255,255,255,0.35);color:#fef7ff;text-decoration:none;font-weight:600;">Back to invitation</a>`
    : "";
  const thankYou = `<!doctype html><html><head><meta charset="utf-8"><title>RSVP received</title></head><body style="font-family: system-ui; padding: 40px; background: #0a0a14; color: #fef7ff; display:flex; align-items:center; justify-content:center; min-height:100vh;"><main style="text-align:center; max-width:560px; display:grid; gap:16px;"><h1 style="font-size:36px; margin:0;">RSVP received</h1><p style="margin:0; color:rgba(255,255,255,0.7);">Thanks${guestDisplayName ? ", " + guestDisplayName : ""}. You can return to update your response anytime.</p><div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">${privateLink}${calendarLink}${backLink}</div>${sessionUser ? "" : `<p style=\"margin:4px 0 0; color:rgba(255,255,255,0.7);\">Want to manage all your invitations in one place?</p><div style=\"display:flex; gap:12px; justify-content:center; flex-wrap:wrap;\">${accountLink}</div>`}</main></body></html>`;
  const response = new NextResponse(thankYou, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  if (openToken && guestGroupToken) {
    response.cookies.set({
      name: `oi_open_${openToken}`,
      value: guestGroupToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
