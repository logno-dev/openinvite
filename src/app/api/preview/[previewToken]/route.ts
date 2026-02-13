import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invitationDetails,
  invitationHosts,
  invitations,
  rsvpOptions,
  users,
} from "@/db/schema";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ previewToken: string }> }
) {
  const { previewToken } = await params;
  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      openRsvpToken: invitations.openRsvpToken,
      timezone: invitations.timezone,
      countMode: invitations.countMode,
    })
    .from(invitations)
    .where(eq(invitations.previewToken, previewToken))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];

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

  return NextResponse.json({
    invitation: record,
    details: details[0] ?? null,
    hostNames: hostNames.map((host) => host.name).filter(Boolean),
    rsvpOptions: options,
  });
}
