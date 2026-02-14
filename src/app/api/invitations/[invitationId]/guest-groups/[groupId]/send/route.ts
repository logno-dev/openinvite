import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitationDetails, invitationHosts, invitations } from "@/db/schema";
import { formatDate, formatTime } from "@/lib/date-format";
import { getAppUrl, isMailerConfigured, sendMail } from "@/lib/mailer";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isMailerConfigured()) {
    return NextResponse.json({ error: "Email provider is not configured" }, { status: 503 });
  }

  const invitation = await db
    .select({
      title: invitations.title,
      timezone: invitations.timezone,
      eventDate: invitationDetails.eventDate,
      eventTime: invitationDetails.eventTime,
      date: invitationDetails.date,
      time: invitationDetails.time,
      dateFormat: invitationDetails.dateFormat,
      timeFormat: invitationDetails.timeFormat,
      locationName: invitationDetails.locationName,
    })
    .from(invitations)
    .leftJoin(invitationDetails, eq(invitationDetails.invitationId, invitations.id))
    .where(eq(invitations.id, invitationId))
    .limit(1);
  if (invitation.length === 0) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const group = await db
    .select({ displayName: guestGroups.displayName, email: guestGroups.email, token: guestGroups.token })
    .from(guestGroups)
    .where(and(eq(guestGroups.id, groupId), eq(guestGroups.invitationId, invitationId)))
    .limit(1);
  if (group.length === 0) {
    return NextResponse.json({ error: "Guest group not found" }, { status: 404 });
  }
  if (!group[0].email) {
    return NextResponse.json({ error: "Guest does not have an email address" }, { status: 400 });
  }

  const dateValue = invitation[0].eventDate ?? invitation[0].date ?? null;
  const timeValue = invitation[0].eventTime ?? invitation[0].time ?? null;
  const formattedDate = formatDate(
    dateValue,
    (invitation[0].dateFormat ?? "MMM d, yyyy") as
      | "MMM d, yyyy"
      | "MMMM d, yyyy"
      | "EEE, MMM d"
      | "yyyy-MM-dd"
  );
  const formattedTime = formatTime(
    timeValue,
    (invitation[0].timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
  );
  const invitationUrl = `${getAppUrl()}/i/${group[0].token}`;

  await sendMail({
    to: group[0].email,
    subject: `You're invited: ${invitation[0].title}`,
    html: `<p>Hi ${group[0].displayName},</p><p>You are invited to <strong>${invitation[0].title}</strong>.</p><p>${formattedDate ?? ""}${formattedTime ? ` at ${formattedTime}` : ""}${invitation[0].locationName ? ` · ${invitation[0].locationName}` : ""}</p><p><a href="${invitationUrl}">Open your invitation and RSVP</a></p>`,
    text: `Hi ${group[0].displayName},\n\nYou are invited to ${invitation[0].title}.\n${formattedDate ?? ""}${formattedTime ? ` at ${formattedTime}` : ""}${invitation[0].locationName ? ` · ${invitation[0].locationName}` : ""}\n\nOpen your invitation and RSVP: ${invitationUrl}`,
  });

  return NextResponse.json({ ok: true });
}
