import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invitationDetails,
  invitationTouchpointDetails,
  invitationTouchpoints,
  invitations,
} from "@/db/schema";

type TouchpointKind = "invitation" | "save_the_date";

export type ResolvedTouchpoint = {
  id: string | null;
  kind: TouchpointKind;
  name: string;
  title: string;
  collectRsvp: boolean;
  templateUrlDraft: string | null;
  templateUrlLive: string | null;
  details: {
    date: string | null;
    time: string | null;
    eventDate: string | null;
    eventTime: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    locationName: string | null;
    address: string | null;
    mapLink: string | null;
    registryLink: string | null;
    mapEmbed: string | null;
    notes: string | null;
    notes2: string | null;
    notes3: string | null;
  };
};

export async function getResolvedTouchpoint(
  invitationId: string,
  kind: TouchpointKind = "invitation"
): Promise<ResolvedTouchpoint | null> {
  const touchpoint = await db
    .select({
      id: invitationTouchpoints.id,
      kind: invitationTouchpoints.kind,
      name: invitationTouchpoints.name,
      title: invitationTouchpoints.title,
      collectRsvp: invitationTouchpoints.collectRsvp,
      templateUrlDraft: invitationTouchpoints.templateUrlDraft,
      templateUrlLive: invitationTouchpoints.templateUrlLive,
      date: invitationTouchpointDetails.date,
      time: invitationTouchpointDetails.time,
      eventDate: invitationTouchpointDetails.eventDate,
      eventTime: invitationTouchpointDetails.eventTime,
      dateFormat: invitationTouchpointDetails.dateFormat,
      timeFormat: invitationTouchpointDetails.timeFormat,
      locationName: invitationTouchpointDetails.locationName,
      address: invitationTouchpointDetails.address,
      mapLink: invitationTouchpointDetails.mapLink,
      registryLink: invitationTouchpointDetails.registryLink,
      mapEmbed: invitationTouchpointDetails.mapEmbed,
      notes: invitationTouchpointDetails.notes,
      notes2: invitationTouchpointDetails.notes2,
      notes3: invitationTouchpointDetails.notes3,
    })
    .from(invitationTouchpoints)
    .leftJoin(
      invitationTouchpointDetails,
      eq(invitationTouchpointDetails.touchpointId, invitationTouchpoints.id)
    )
    .where(
      and(
        eq(invitationTouchpoints.invitationId, invitationId),
        eq(invitationTouchpoints.kind, kind),
        eq(invitationTouchpoints.isActive, true)
      )
    )
    .orderBy(desc(invitationTouchpoints.createdAt))
    .limit(1);

  if (touchpoint.length > 0) {
    const row = touchpoint[0];
    return {
      id: row.id,
      kind: (row.kind as TouchpointKind) ?? kind,
      name: row.name,
      title: row.title ?? row.name,
      collectRsvp: row.collectRsvp,
      templateUrlDraft: row.templateUrlDraft,
      templateUrlLive: row.templateUrlLive,
      details: {
        date: row.date,
        time: row.time,
        eventDate: row.eventDate,
        eventTime: row.eventTime,
        dateFormat: row.dateFormat,
        timeFormat: row.timeFormat,
        locationName: row.locationName,
        address: row.address,
        mapLink: row.mapLink,
        registryLink: row.registryLink,
        mapEmbed: row.mapEmbed,
        notes: row.notes,
        notes2: row.notes2,
        notes3: row.notes3,
      },
    };
  }

  const invitation = await db
    .select({
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      templateUrlLive: invitations.templateUrlLive,
    })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (invitation.length === 0) {
    return null;
  }

  const details = await db
    .select()
    .from(invitationDetails)
    .where(eq(invitationDetails.invitationId, invitationId))
    .limit(1);

  return {
    id: null,
    kind,
    name: "Invitation",
    title: invitation[0].title,
    collectRsvp: true,
    templateUrlDraft: invitation[0].templateUrlDraft,
    templateUrlLive: invitation[0].templateUrlLive,
    details: {
      date: details[0]?.date ?? null,
      time: details[0]?.time ?? null,
      eventDate: details[0]?.eventDate ?? null,
      eventTime: details[0]?.eventTime ?? null,
      dateFormat: details[0]?.dateFormat ?? null,
      timeFormat: details[0]?.timeFormat ?? null,
      locationName: details[0]?.locationName ?? null,
      address: details[0]?.address ?? null,
      mapLink: details[0]?.mapLink ?? null,
      registryLink: details[0]?.registryLink ?? null,
      mapEmbed: details[0]?.mapEmbed ?? null,
      notes: details[0]?.notes ?? null,
      notes2: details[0]?.notes2 ?? null,
      notes3: details[0]?.notes3 ?? null,
    },
  };
}
