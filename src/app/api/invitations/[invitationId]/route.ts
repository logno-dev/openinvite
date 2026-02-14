import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invitationDetails,
  invitationHosts,
  invitations,
  rsvpOptions,
} from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type UpdateInvitationPayload = {
  title?: string;
  timezone?: string;
  countMode?: "split" | "total";
  shareGuestList?: boolean;
  templateUrlDraft?: string | null;
  templateUrlLive?: string | null;
  date?: string | null;
  time?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
  locationName?: string | null;
  address?: string | null;
  mapLink?: string | null;
  registryLink?: string | null;
  mapEmbed?: string | null;
  notes?: string | null;
  notes2?: string | null;
  notes3?: string | null;
  rsvpOptions?: Array<{ key: string; label: string }>;
};

async function assertTemplateUrl(url: string, label: string) {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${label} template not reachable`);
  }
}

export async function PATCH(
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

  const body = (await request.json()) as UpdateInvitationPayload;

  const invitationUpdate: Partial<typeof invitations.$inferInsert> = {};
  if (body.title !== undefined) {
    invitationUpdate.title = body.title.trim();
  }
  if (body.timezone !== undefined) {
    invitationUpdate.timezone = body.timezone.trim();
  }
  if (body.countMode !== undefined) {
    invitationUpdate.countMode = body.countMode;
  }
  if (body.shareGuestList !== undefined) {
    invitationUpdate.shareGuestList = body.shareGuestList;
  }
  if (body.templateUrlDraft !== undefined) {
    invitationUpdate.templateUrlDraft = body.templateUrlDraft?.trim() || null;
  }
  if (body.templateUrlLive !== undefined) {
    invitationUpdate.templateUrlLive = body.templateUrlLive?.trim() || null;
  }

  try {
    if (invitationUpdate.templateUrlDraft) {
      // Draft URLs are not validated to allow localhost previews.
    }
    if (invitationUpdate.templateUrlLive) {
      await assertTemplateUrl(invitationUpdate.templateUrlLive, "Live");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template not reachable";
    return NextResponse.json(
      { error: `${message}. Check the URL is being served.` },
      { status: 400 }
    );
  }

  if (Object.keys(invitationUpdate).length > 0) {
    await db
      .update(invitations)
      .set(invitationUpdate)
      .where(eq(invitations.id, invitationId));
  }

  if (
    body.date !== undefined ||
    body.time !== undefined ||
    body.eventDate !== undefined ||
    body.eventTime !== undefined ||
    body.dateFormat !== undefined ||
    body.timeFormat !== undefined ||
      body.locationName !== undefined ||
      body.address !== undefined ||
      body.mapLink !== undefined ||
      body.registryLink !== undefined ||
      body.mapEmbed !== undefined ||
      body.notes !== undefined ||
    body.notes2 !== undefined ||
    body.notes3 !== undefined
  ) {
    await db
      .insert(invitationDetails)
      .values({
        invitationId,
        date: body.date?.trim() || null,
        time: body.time?.trim() || null,
        eventDate: body.eventDate?.trim() || null,
        eventTime: body.eventTime?.trim() || null,
        dateFormat: body.dateFormat?.trim() || null,
        timeFormat: body.timeFormat?.trim() || null,
        locationName: body.locationName?.trim() || null,
        address: body.address?.trim() || null,
        mapLink: body.mapLink?.trim() || null,
        registryLink: body.registryLink?.trim() || null,
        mapEmbed: body.mapEmbed?.trim() || null,
        notes: body.notes?.trim() || null,
        notes2: body.notes2?.trim() || null,
        notes3: body.notes3?.trim() || null,
      })
      .onConflictDoUpdate({
        target: invitationDetails.invitationId,
        set: {
          date: body.date?.trim() || null,
          time: body.time?.trim() || null,
          eventDate: body.eventDate?.trim() || null,
          eventTime: body.eventTime?.trim() || null,
          dateFormat: body.dateFormat?.trim() || null,
          timeFormat: body.timeFormat?.trim() || null,
          locationName: body.locationName?.trim() || null,
          address: body.address?.trim() || null,
          mapLink: body.mapLink?.trim() || null,
          registryLink: body.registryLink?.trim() || null,
          mapEmbed: body.mapEmbed?.trim() || null,
          notes: body.notes?.trim() || null,
          notes2: body.notes2?.trim() || null,
          notes3: body.notes3?.trim() || null,
        },
      });
  }

  if (body.rsvpOptions) {
    await db
      .delete(rsvpOptions)
      .where(eq(rsvpOptions.invitationId, invitationId));
    await db.insert(rsvpOptions).values(
      body.rsvpOptions.map((option, index) => ({
        id: crypto.randomUUID(),
        invitationId,
        key: option.key,
        label: option.label,
        isDefault: true,
        sortOrder: index,
      }))
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
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

    const invitation = await db
      .select({
        id: invitations.id,
        title: invitations.title,
        timezone: invitations.timezone,
      templateUrlDraft: invitations.templateUrlDraft,
      templateUrlLive: invitations.templateUrlLive,
      openRsvpToken: invitations.openRsvpToken,
      previewToken: invitations.previewToken,
      createdAt: invitations.createdAt,
      countMode: invitations.countMode,
      shareGuestList: invitations.shareGuestList,
    })
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    if (invitation.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const details = await db
      .select()
      .from(invitationDetails)
      .where(eq(invitationDetails.invitationId, invitationId))
      .limit(1);

    const options = await db
      .select({ key: rsvpOptions.key, label: rsvpOptions.label })
      .from(rsvpOptions)
      .where(eq(rsvpOptions.invitationId, invitationId));

    return NextResponse.json({
      invitation: invitation[0],
      details: details[0] ?? null,
      rsvpOptions: options,
    });
  } catch (error) {
    console.error("Invitation GET failed", error);
    return NextResponse.json({ error: "Failed to load invitation" }, { status: 500 });
  }
}
