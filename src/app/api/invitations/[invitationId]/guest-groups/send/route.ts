import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitationDetails, invitationHosts, invitations } from "@/db/schema";
import { buildInvitationEmail } from "@/lib/invitation-email";
import { isMailerConfigured, sendMail } from "@/lib/mailer";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type Payload = {
  includeAlreadySent?: boolean;
  mode?: "invite" | "update";
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
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

  const body = (await request.json()) as Payload;
  const includeAlreadySent = body.includeAlreadySent ?? false;
  const mode = body.mode === "update" ? "update" : "invite";

  const invitation = await db
    .select({
      title: invitations.title,
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

  const baseQuery = db
    .select({
      id: guestGroups.id,
      displayName: guestGroups.displayName,
      email: guestGroups.email,
      token: guestGroups.token,
      inviteEmailSentAt: guestGroups.inviteEmailSentAt,
    })
    .from(guestGroups);

  const groups = includeAlreadySent
    ? await baseQuery.where(
        and(eq(guestGroups.invitationId, invitationId), isNotNull(guestGroups.email))
      )
    : await baseQuery.where(
        and(
          eq(guestGroups.invitationId, invitationId),
          isNotNull(guestGroups.email),
          isNull(guestGroups.inviteEmailSentAt)
        )
      );

  let sentCount = 0;
  for (const group of groups) {
    if (!group.email) continue;
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
        address: invitation[0].address,
      },
      {
        displayName: group.displayName,
        token: group.token,
      },
      mode
    );
    await sendMail({
      to: group.email,
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
      .where(eq(guestGroups.id, group.id));
    sentCount += 1;
  }

  return NextResponse.json({ ok: true, sentCount });
}
