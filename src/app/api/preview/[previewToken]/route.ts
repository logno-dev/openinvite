import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationHosts, invitations, rsvpOptions, users } from "@/db/schema";
import { getResolvedTouchpoint } from "@/lib/touchpoints";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ previewToken: string }> }
) {
  const { previewToken } = await params;
  const requestUrl = new URL(request.url);
  const kind =
    requestUrl.searchParams.get("kind") === "save_the_date"
      ? "save_the_date"
      : "invitation";
  const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      templateUrlLive: invitations.templateUrlLive,
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

  const touchpoint = await getResolvedTouchpoint(record.id, kind);

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
    touchpoint: touchpoint
      ? {
          id: touchpoint.id,
          kind: touchpoint.kind,
          name: touchpoint.name,
          collectRsvp: touchpoint.collectRsvp,
          templateUrlDraft: touchpoint.templateUrlDraft,
          templateUrlLive: touchpoint.templateUrlLive,
        }
      : null,
    details: touchpoint?.details ?? null,
    hostNames: hostNames.map((host) => host.name).filter(Boolean),
    rsvpOptions: options,
  });
}
