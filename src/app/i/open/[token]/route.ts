import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestGroups,
  invitations,
  rsvpOptions,
} from "@/db/schema";
import { formatDate, formatTime } from "@/lib/date-format";
import { injectTemplateData, sanitizeTemplate } from "@/lib/template";
import { renderRsvpForm } from "@/lib/rsvp";
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
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      countMode: invitations.countMode,
    })
    .from(invitations)
    .where(eq(invitations.openRsvpToken, token))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];
  const touchpoint = await getResolvedTouchpoint(record.id, "invitation");
  const templateUrlLive = touchpoint?.templateUrlLive ?? null;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(`oi_open_${token}`)?.value ?? null;
  if (guestToken) {
    const matchingGroup = await db
      .select({ id: guestGroups.id })
      .from(guestGroups)
      .where(
        and(eq(guestGroups.token, guestToken), eq(guestGroups.invitationId, record.id))
      )
      .limit(1);
    if (matchingGroup.length > 0) {
      return NextResponse.redirect(new URL(`/i/${guestToken}`, request.url));
    }
  }

  if (!touchpoint || !templateUrlLive) {
    return NextResponse.json({ error: "Template URL missing" }, { status: 400 });
  }

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, record.id));

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
          options,
          tokenFieldName: "openToken",
          tokenValue: token,
          countMode: record.countMode === "total" ? "total" : "split",
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
      hostNames: "",
      rsvpOptions: options,
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
