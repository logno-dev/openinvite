import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, invitations, rsvpOptions, rsvpResponses } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = await db
    .select({
      groupId: guestGroups.id,
      guestToken: guestGroups.token,
      displayName: guestGroups.displayName,
      invitationId: invitations.id,
      invitationTitle: invitations.title,
      countMode: invitations.countMode,
      shareGuestList: invitations.shareGuestList,
    })
    .from(guestGroups)
    .innerJoin(invitations, eq(invitations.id, guestGroups.invitationId))
    .where(eq(guestGroups.respondentUserId, user.id));

  if (groups.length === 0) {
    return NextResponse.json({ invitations: [] });
  }

  const groupIds = groups.map((group) => group.groupId);
  const invitationIds = Array.from(new Set(groups.map((group) => group.invitationId)));

  const responses = await db
    .select({
      groupId: rsvpResponses.groupId,
      optionKey: rsvpResponses.optionKey,
      adults: rsvpResponses.adults,
      kids: rsvpResponses.kids,
      total: rsvpResponses.total,
      message: rsvpResponses.message,
      updatedAt: rsvpResponses.updatedAt,
    })
    .from(rsvpResponses)
    .where(inArray(rsvpResponses.groupId, groupIds));

  const options = await db
    .select({
      invitationId: rsvpOptions.invitationId,
      key: rsvpOptions.key,
      label: rsvpOptions.label,
    })
    .from(rsvpOptions)
    .where(inArray(rsvpOptions.invitationId, invitationIds));

  const responseByGroup = new Map(responses.map((response) => [response.groupId, response]));
  const optionLabelByInvitationAndKey = new Map(
    options.map((option) => [`${option.invitationId}:${option.key}`, option.label])
  );

  const payload = groups.map((group) => {
    const response = responseByGroup.get(group.groupId) ?? null;
    const optionLabel = response
      ? optionLabelByInvitationAndKey.get(`${group.invitationId}:${response.optionKey}`) ??
        response.optionKey
      : null;

    return {
      groupId: group.groupId,
      guestToken: group.guestToken,
      displayName: group.displayName,
      invitationId: group.invitationId,
      invitationTitle: group.invitationTitle,
      countMode: group.countMode,
      shareGuestList: group.shareGuestList,
      response: response
        ? {
            optionKey: response.optionKey,
            optionLabel,
            adults: response.adults,
            kids: response.kids,
            total: response.total,
            message: response.message,
            updatedAt: response.updatedAt,
          }
        : null,
    };
  });

  return NextResponse.json({ invitations: payload });
}
