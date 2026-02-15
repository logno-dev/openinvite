import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestGroups,
  invitationHosts,
  invitations,
  rsvpOptions,
  rsvpResponses,
  users,
} from "@/db/schema";
import { formatDate, formatTime } from "@/lib/date-format";
import { linkGuestGroupToUserByToken } from "@/lib/guest-groups";
import { injectTemplateData, sanitizeTemplate } from "@/lib/template";
import { renderRsvpForm } from "@/lib/rsvp";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";
import { getResolvedTouchpoint } from "@/lib/touchpoints";

export const runtime = "nodejs";

async function fetchTemplate(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Template fetch failed");
  }
  return response.text();
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value ?? null;
  const sessionUser = sessionToken
    ? await getSessionUserByToken(sessionToken)
    : null;
  if (sessionUser) {
    await linkGuestGroupToUserByToken(sessionUser.id, token, {
      userEmail: sessionUser.email,
    });
  }

  const group = await db
    .select({
      id: guestGroups.id,
      invitationId: guestGroups.invitationId,
      displayName: guestGroups.displayName,
      expectedAdults: guestGroups.expectedAdults,
      expectedKids: guestGroups.expectedKids,
      expectedTotal: guestGroups.expectedTotal,
      openCount: guestGroups.openCount,
      notes: guestGroups.notes,
    })
    .from(guestGroups)
    .where(eq(guestGroups.token, token))
    .limit(1);

  if (group.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      countMode: invitations.countMode,
    })
    .from(invitations)
    .where(eq(invitations.id, group[0].invitationId))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];
  const touchpoint = await getResolvedTouchpoint(record.id, "invitation");
  const templateUrlLive = touchpoint?.templateUrlLive ?? null;
  if (!touchpoint || !templateUrlLive) {
    return NextResponse.json({ error: "Template URL missing" }, { status: 400 });
  }

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, record.id));

  const hostNames = await db
    .select({ name: users.displayName })
    .from(invitationHosts)
    .innerJoin(users, eq(users.id, invitationHosts.userId))
    .where(eq(invitationHosts.invitationId, record.id));

  const latestResponse = await db
    .select({
      optionKey: rsvpResponses.optionKey,
      adults: rsvpResponses.adults,
      kids: rsvpResponses.kids,
      total: rsvpResponses.total,
      message: rsvpResponses.message,
    })
    .from(rsvpResponses)
    .where(eq(rsvpResponses.groupId, group[0].id))
    .orderBy(desc(rsvpResponses.updatedAt))
    .limit(1);

  let injected = "";
  try {
    const html = await fetchTemplate(templateUrlLive);
    const sanitized = sanitizeTemplate(html);
    const dateValue = touchpoint.details.eventDate ?? touchpoint.details.date ?? null;
    const timeValue = touchpoint.details.eventTime ?? touchpoint.details.time ?? null;
    const formattedDate = formatDate(
      dateValue,
      (touchpoint.details.dateFormat ?? "MMM d, yyyy") as
        | "MMM d, yyyy"
        | "MMMM d, yyyy"
        | "EEE, MMM d"
        | "yyyy-MM-dd"
    );
    const formattedTime = formatTime(
      timeValue,
      (touchpoint.details.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
    );

    const responseHtml = touchpoint.collectRsvp
      ? renderRsvpForm({
          actionUrl: "/api/rsvp",
          guestName: group[0].displayName,
          expectedAdults: group[0].expectedAdults,
          expectedKids: group[0].expectedKids,
          expectedTotal: group[0].expectedTotal,
          responseOptionKey: latestResponse[0]?.optionKey ?? null,
          responseAdults: latestResponse[0]?.adults ?? null,
          responseKids: latestResponse[0]?.kids ?? null,
          responseTotal: latestResponse[0]?.total ?? null,
          responseMessage: latestResponse[0]?.message ?? null,
          options,
          tokenFieldName: "guestToken",
          tokenValue: token,
          countMode: record.countMode === "total" ? "total" : "split",
          allowOpenCount: group[0].openCount,
        })
      : null;

    injected = injectTemplateData(sanitized, {
      title: touchpoint.title,
      date: formattedDate,
      time: formattedTime,
      locationName: touchpoint.details.locationName,
      address: touchpoint.details.address,
      mapLink: touchpoint.details.mapLink,
      registryLink: touchpoint.details.registryLink,
      mapEmbed: touchpoint.details.mapEmbed,
      notes: touchpoint.details.notes,
      notes2: touchpoint.details.notes2,
      notes3: touchpoint.details.notes3,
      hostNames: hostNames
        .map((host) => host.name)
        .filter(Boolean)
        .join(" + "),
      rsvpOptions: options,
      guestDisplayName: group[0].displayName,
      guestMessage: group[0].notes,
      expectedAdults: group[0].expectedAdults,
      expectedKids: group[0].expectedKids,
      expectedTotal: group[0].expectedTotal,
      responseHtml,
      calendarLink: `/api/calendar/${token}`,
    });
  } catch {
    injected = `<!doctype html><html><head><meta charset="utf-8"><title>Template not available</title></head><body style="font-family: sans-serif; padding: 40px; background: #0a0a14; color: #fef7ff;"><h1>Template not available</h1><p>Check that the live template URL is reachable and currently serving HTML.</p></body></html>`;
    return new NextResponse(injected, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(injected, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com https:; font-src https://fonts.gstatic.com https: data:; frame-src https://www.google.com/maps https://www.google.com/maps/embed;",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
