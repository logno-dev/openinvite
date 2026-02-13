import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationDetails, invitations, rsvpOptions } from "@/db/schema";
import { formatDate, formatTime } from "@/lib/date-format";
import { injectTemplateData, sanitizeTemplate } from "@/lib/template";
import { renderRsvpForm } from "@/lib/rsvp";

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
  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlLive: invitations.templateUrlLive,
      countMode: invitations.countMode,
    })
    .from(invitations)
    .where(eq(invitations.openRsvpToken, token))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];
  const templateUrlLive = record.templateUrlLive;

  if (!templateUrlLive) {
    return NextResponse.json({ error: "Template URL missing" }, { status: 400 });
  }

  const details = await db
    .select()
    .from(invitationDetails)
    .where(eq(invitationDetails.invitationId, record.id))
    .limit(1);

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, record.id));

  let injected = "";
  try {
    const html = await fetchTemplate(templateUrlLive);
    const sanitized = sanitizeTemplate(html);
    const dateValue = details[0]?.eventDate ?? details[0]?.date ?? null;
    const timeValue = details[0]?.eventTime ?? details[0]?.time ?? null;
    const formattedDate = formatDate(
      dateValue,
      (details[0]?.dateFormat ?? "MMM d, yyyy") as
        | "MMM d, yyyy"
        | "MMMM d, yyyy"
        | "EEE, MMM d"
        | "yyyy-MM-dd"
    );
    const formattedTime = formatTime(
      timeValue,
      (details[0]?.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
    );

    injected = injectTemplateData(sanitized, {
      title: record.title,
      date: formattedDate,
      time: formattedTime,
      locationName: details[0]?.locationName ?? null,
      address: details[0]?.address ?? null,
      mapLink: details[0]?.mapLink ?? null,
      mapEmbed: details[0]?.mapEmbed ?? null,
      notes: details[0]?.notes ?? null,
      hostNames: "",
      rsvpOptions: options,
      responseHtml: renderRsvpForm({
        actionUrl: "/api/rsvp",
        options,
        tokenFieldName: "openToken",
        tokenValue: token,
        countMode: record.countMode === "total" ? "total" : "split",
      }),
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
    },
  });
}
