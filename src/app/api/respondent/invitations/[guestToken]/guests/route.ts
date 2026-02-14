import { NextRequest, NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestGroups,
  invitationGuestMessages,
  invitations,
  rsvpOptions,
  rsvpResponses,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

async function resolveViewerAccess(request: NextRequest, guestToken: string) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const group = await db
    .select({
      groupId: guestGroups.id,
      respondentUserId: guestGroups.respondentUserId,
      displayName: guestGroups.displayName,
      invitationId: invitations.id,
      invitationTitle: invitations.title,
      countMode: invitations.countMode,
      shareGuestList: invitations.shareGuestList,
    })
    .from(guestGroups)
    .innerJoin(invitations, eq(invitations.id, guestGroups.invitationId))
    .where(eq(guestGroups.token, guestToken))
    .limit(1);

  if (group.length === 0) {
    return { error: NextResponse.json({ error: "Invitation not found" }, { status: 404 }) };
  }

  if (group[0].respondentUserId !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (!group[0].shareGuestList) {
    return {
      error: NextResponse.json({ error: "Guest list is private for this invitation" }, { status: 403 }),
    };
  }

  return {
    user,
    invitationId: group[0].invitationId,
    invitationTitle: group[0].invitationTitle,
    countMode: group[0].countMode,
    viewerGroupId: group[0].groupId,
    viewerDisplayName: group[0].displayName,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestToken: string }> }
) {
  const { guestToken } = await params;
  const access = await resolveViewerAccess(request, guestToken);
  if ("error" in access) return access.error;

  const groups = await db
    .select({
      id: guestGroups.id,
      displayName: guestGroups.displayName,
      email: users.email,
      shareEmailWithGuests: users.shareEmailWithGuests,
    })
    .from(guestGroups)
    .leftJoin(users, eq(users.id, guestGroups.respondentUserId))
    .where(eq(guestGroups.invitationId, access.invitationId));
  const groupIds = groups.map((group) => group.id);

  const responses = groupIds.length
    ? await db
        .select({
          groupId: rsvpResponses.groupId,
          optionKey: rsvpResponses.optionKey,
          adults: rsvpResponses.adults,
          kids: rsvpResponses.kids,
          total: rsvpResponses.total,
          updatedAt: rsvpResponses.updatedAt,
        })
        .from(rsvpResponses)
        .where(inArray(rsvpResponses.groupId, groupIds))
    : [];

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, access.invitationId));
  const optionLabelByKey = new Map(options.map((option) => [option.key, option.label]));

  const responseByGroupId = new Map<string, (typeof responses)[number]>();
  for (const response of responses) {
    const existing = responseByGroupId.get(response.groupId);
    const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
    const nextTime = response.updatedAt ? new Date(response.updatedAt).getTime() : 0;
    if (!existing || nextTime >= existingTime) {
      responseByGroupId.set(response.groupId, response);
    }
  }

  const guestList = groups
    .map((group) => {
      if (group.id === access.viewerGroupId) return null;
      const response = responseByGroupId.get(group.id);
      if (!response) return null;
      return {
        groupId: group.id,
        displayName: group.displayName,
        sharedEmail: group.shareEmailWithGuests ? group.email : null,
        optionKey: response.optionKey,
        optionLabel: optionLabelByKey.get(response.optionKey) ?? response.optionKey,
        adults: response.adults,
        kids: response.kids,
        total: response.total,
        updatedAt: response.updatedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const messages = await db
    .select({
      id: invitationGuestMessages.id,
      groupId: invitationGuestMessages.groupId,
      message: invitationGuestMessages.message,
      createdAt: invitationGuestMessages.createdAt,
      authorName: guestGroups.displayName,
    })
    .from(invitationGuestMessages)
    .innerJoin(guestGroups, eq(guestGroups.id, invitationGuestMessages.groupId))
    .where(eq(invitationGuestMessages.invitationId, access.invitationId))
    .orderBy(asc(invitationGuestMessages.createdAt));

  return NextResponse.json({
    invitationTitle: access.invitationTitle,
    countMode: access.countMode,
    guestList,
    messages,
  });
}

type PostMessagePayload = {
  message?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guestToken: string }> }
) {
  const { guestToken } = await params;
  const access = await resolveViewerAccess(request, guestToken);
  if ("error" in access) return access.error;

  const body = (await request.json()) as PostMessagePayload;
  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "Message must be 500 characters or less" }, { status: 400 });
  }

  const createdAt = new Date();
  const id = crypto.randomUUID();
  await db.insert(invitationGuestMessages).values({
    id,
    invitationId: access.invitationId,
    groupId: access.viewerGroupId,
    userId: access.user.id,
    message,
    createdAt,
  });

  return NextResponse.json({
    message: {
      id,
      groupId: access.viewerGroupId,
      message,
      createdAt,
      authorName: access.viewerDisplayName,
    },
  });
}
