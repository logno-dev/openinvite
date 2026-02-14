import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitationDetails, invitationHosts, invitations } from "@/db/schema";
import { buildInvitationEmail } from "@/lib/invitation-email";
import { isMailerConfigured, sendMail } from "@/lib/mailer";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string; groupId: string }> }
) {
  const mode = request.nextUrl.searchParams.get("mode") === "update" ? "update" : "invite";
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
      address: invitationDetails.address,
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

  const emailContent = buildInvitationEmail(
    {
      title: invitation[0].title,
      eventDate: invitation[0].eventDate,
      eventTime: invitation[0].eventTime,
      date: invitation[0].date,
      time: invitation[0].time,
      dateFormat: invitation[0].dateFormat,
      timeFormat: invitation[0].timeFormat,
      locationName: invitation[0].locationName,
      address: invitation[0].address ?? null,
    },
    {
      displayName: group[0].displayName,
      token: group[0].token,
    },
    mode
  );

  await sendMail({
    to: group[0].email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  await db
    .update(guestGroups)
    .set({
      inviteEmailSentAt: new Date(),
      inviteEmailLastType: mode,
    })
    .where(eq(guestGroups.id, groupId));

  return NextResponse.json({ ok: true });
}
