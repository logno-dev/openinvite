import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invitationDetails,
  invitationHosts,
  invitations,
  rsvpOptions,
} from "@/db/schema";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";
import { formatDate, formatTime } from "@/lib/date-format";
import { injectTemplateData, sanitizeTemplate } from "@/lib/template";

export const runtime = "nodejs";

async function fetchTemplate(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Template fetch failed");
  }
  return response.text();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      openRsvpToken: invitations.openRsvpToken,
    })
    .from(invitations)
    .innerJoin(
      invitationHosts,
      and(
        eq(invitationHosts.invitationId, invitations.id),
        eq(invitationHosts.userId, user.id)
      )
    )
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];
  const templateUrlDraft = record.templateUrlDraft;
  if (!templateUrlDraft) {
    return NextResponse.json({ error: "Template URL missing" }, { status: 400 });
  }

  const details = await db
    .select()
    .from(invitationDetails)
    .where(eq(invitationDetails.invitationId, record.id))
    .limit(1);

  const hostNames = await db
    .select({ name: users.displayName })
    .from(invitationHosts)
    .innerJoin(users, eq(users.id, invitationHosts.userId))
    .where(eq(invitationHosts.invitationId, record.id));

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, record.id));

  const html = await fetchTemplate(templateUrlDraft);
  const sanitized = sanitizeTemplate(html);
  const dateValue =
    details[0]?.eventDate ??
    details[0]?.date ??
    null;
  const timeValue =
    details[0]?.eventTime ??
    details[0]?.time ??
    null;
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

  const injected = injectTemplateData(sanitized, {
    title: record.title,
    date: formattedDate,
    time: formattedTime,
    locationName: details[0]?.locationName ?? null,
    address: details[0]?.address ?? null,
    mapLink: details[0]?.mapLink ?? null,
    mapEmbed: details[0]?.mapEmbed ?? null,
    notes: details[0]?.notes ?? null,
    hostNames: hostNames
      .map((host) => host.name)
      .filter(Boolean)
      .join(" + "),
    rsvpOptions: options,
    calendarLink: record.openRsvpToken ? `/api/calendar/${record.openRsvpToken}` : null,
  });

  return new NextResponse(injected, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https://fonts.googleapis.com https:; font-src https://fonts.gstatic.com https: data:;",
    },
  });
}
