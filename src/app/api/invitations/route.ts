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

type CreateInvitationPayload = {
  title?: string;
  templateUrlDraft?: string;
  templateUrlLive?: string;
  date?: string;
  time?: string;
  locationName?: string;
  address?: string;
  mapLink?: string;
  registryLink?: string;
  mapEmbed?: string;
  notes?: string;
  notes2?: string;
  notes3?: string;
  timezone?: string;
  countMode?: "split" | "total";
  eventDate?: string;
  eventTime?: string;
  dateFormat?: string;
  timeFormat?: string;
  rsvpOptions?: Array<{ key: string; label: string }>;
};

async function assertTemplateUrl(url: string, label: string) {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${label} template not reachable`);
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateInvitationPayload;
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const draftUrl = body.templateUrlDraft?.trim() || null;
  const liveUrl = body.templateUrlLive?.trim() || null;

  try {
    if (draftUrl) {
      // Draft URLs are not validated to allow localhost previews.
    }
    if (liveUrl) {
      await assertTemplateUrl(liveUrl, "Live");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Template not reachable";
    return NextResponse.json(
      { error: `${message}. Check the URL is being served.` },
      { status: 400 }
    );
  }

  const invitationId = crypto.randomUUID();
  const hostId = crypto.randomUUID();

  await db.insert(invitations).values({
    id: invitationId,
    ownerUserId: user.id,
    title,
    timezone: body.timezone?.trim() || "UTC",
    countMode: body.countMode ?? "split",
    templateUrlDraft: draftUrl,
    templateUrlLive: liveUrl,
    openRsvpToken: crypto.randomUUID(),
    previewToken: crypto.randomUUID(),
  });

  await db.insert(invitationHosts).values({
    id: hostId,
    invitationId,
    userId: user.id,
    role: "owner",
    canEdit: true,
  });

  await db.insert(invitationDetails).values({
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
  });

  const options = body.rsvpOptions?.length
    ? body.rsvpOptions
    : [
        { key: "yes", label: "We will be there" },
        { key: "no", label: "No thank you" },
        { key: "maybe", label: "Maybe" },
      ];

  await db.insert(rsvpOptions).values(
    options.map((option, index) => ({
      id: crypto.randomUUID(),
      invitationId,
      key: option.key,
      label: option.label,
      isDefault: true,
      sortOrder: index,
    }))
  );

  const preview = await db
    .select({ previewToken: invitations.previewToken, openRsvpToken: invitations.openRsvpToken })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  return NextResponse.json({
    id: invitationId,
    previewToken: preview[0]?.previewToken ?? null,
    openRsvpToken: preview[0]?.openRsvpToken ?? null,
  });
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      templateUrlLive: invitations.templateUrlLive,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .innerJoin(
      invitationHosts,
      and(
        eq(invitationHosts.invitationId, invitations.id),
        eq(invitationHosts.userId, user.id)
      )
    )
    .orderBy(invitations.createdAt);

  return NextResponse.json({ invitations: results });
}
