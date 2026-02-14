import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  guestGroups,
  invitationGuestMessages,
  invitationHostMessages,
  invitationHosts,
  invitations,
  rsvpOptions,
  rsvpResponses,
  users,
} from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type CreateGuestGroupPayload = {
  displayName?: string;
  email?: string;
  phone?: string;
  expectedAdults?: number;
  expectedKids?: number;
  expectedTotal?: number;
  openCount?: boolean;
  notes?: string;
};

export async function GET(
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
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const groups = await db
    .select({
      id: guestGroups.id,
      displayName: guestGroups.displayName,
      email: guestGroups.email,
      phone: guestGroups.phone,
      expectedAdults: guestGroups.expectedAdults,
      expectedKids: guestGroups.expectedKids,
      expectedTotal: guestGroups.expectedTotal,
      openCount: guestGroups.openCount,
      inviteEmailSentAt: guestGroups.inviteEmailSentAt,
      inviteEmailLastType: guestGroups.inviteEmailLastType,
      token: guestGroups.token,
      createdAt: guestGroups.createdAt,
    })
    .from(guestGroups)
    .where(eq(guestGroups.invitationId, invitationId))
    .orderBy(guestGroups.createdAt);

  const responseRows = await db
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
    .innerJoin(guestGroups, eq(guestGroups.id, rsvpResponses.groupId))
    .where(eq(guestGroups.invitationId, invitationId));

  const responseByGroup = new Map(
    responseRows.map((row) => [
      row.groupId,
      {
        optionKey: row.optionKey,
        adults: row.adults,
        kids: row.kids,
        total: row.total,
        message: row.message,
        updatedAt: row.updatedAt,
      },
    ])
  );

  const enriched = groups.map((group) => ({
    ...group,
    response: responseByGroup.get(group.id) ?? null,
  }));

  const invitation = await db
    .select({ countMode: invitations.countMode, openRsvpToken: invitations.openRsvpToken })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, invitationId));

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
    .where(eq(invitationGuestMessages.invitationId, invitationId));

  const hostMessages = await db
    .select({
      id: invitationHostMessages.id,
      message: invitationHostMessages.message,
      createdAt: invitationHostMessages.createdAt,
      authorName: users.displayName,
      fallbackEmail: users.email,
    })
    .from(invitationHostMessages)
    .innerJoin(users, eq(users.id, invitationHostMessages.userId))
    .where(eq(invitationHostMessages.invitationId, invitationId));

  function toEpoch(value: unknown) {
    if (!value) return 0;
    if (value instanceof Date) return value.getTime();
    return new Date(String(value)).getTime();
  }

  const mergedMessages = [
    ...messages.map((message) => ({
      ...message,
      authorRole: "guest" as const,
    })),
    ...hostMessages.map((message) => ({
      id: message.id,
      groupId: null,
      message: message.message,
      createdAt: message.createdAt,
      authorName: message.authorName || message.fallbackEmail,
      authorRole: "host" as const,
    })),
  ].sort((a, b) => {
    const at = toEpoch(a.createdAt);
    const bt = toEpoch(b.createdAt);
    return at - bt;
  });

  return NextResponse.json({
    guestGroups: enriched,
    countMode: invitation[0]?.countMode ?? "split",
    rsvpOptions: options,
    openRsvpToken: invitation[0]?.openRsvpToken ?? null,
    messages: mergedMessages,
  });
}

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
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const body = (await request.json()) as CreateGuestGroupPayload;
  const displayName = body.displayName?.trim();
  if (!displayName) {
    return NextResponse.json({ error: "Display name required" }, { status: 400 });
  }

  const expectedAdults = Math.max(0, body.expectedAdults ?? 0);
  const expectedKids = Math.max(0, body.expectedKids ?? 0);
  const expectedTotal = Math.max(
    body.expectedTotal ?? expectedAdults + expectedKids,
    0
  );

  const invitation = await db
    .select({ countMode: invitations.countMode })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const isOpenCount = body.openCount ?? false;
  if (isOpenCount) {
    const hasMinimumForOpenCount =
      invitation[0].countMode === "total"
        ? expectedTotal >= 1
        : expectedAdults + expectedKids >= 1;
    if (!hasMinimumForOpenCount) {
      return NextResponse.json(
        {
          error:
            invitation[0].countMode === "total"
              ? "Open count requires expected total of at least 1"
              : "Open count requires at least 1 adult or child",
        },
        { status: 400 }
      );
    }
  }

  const groupId = crypto.randomUUID();
  const token = crypto.randomUUID();

  await db.insert(guestGroups).values({
    id: groupId,
    invitationId,
    displayName,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    token,
    expectedAdults,
    expectedKids,
    expectedTotal,
    openCount: isOpenCount,
    inviteEmailSentAt: null,
    inviteEmailLastType: null,
    notes: body.notes?.trim() || null,
  });

  return NextResponse.json({ id: groupId, token });
}
