import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { guestGroups, guests, rsvpResponses } from "@/db/schema";

type LinkOptions = {
  allowMergeWithExisting?: boolean;
};

type LinkResult = {
  linked: boolean;
  reason:
    | "missing_token"
    | "not_found"
    | "already_linked"
    | "claimed_by_other"
    | "linked"
    | "merged_to_existing";
  linkedToken?: string;
};

export async function linkGuestGroupToUserByToken(
  userId: string,
  token: string,
  options?: LinkOptions
): Promise<LinkResult> {
  if (!token) return { linked: false, reason: "missing_token" };

  const group = await db
    .select({
      id: guestGroups.id,
      token: guestGroups.token,
      invitationId: guestGroups.invitationId,
      respondentUserId: guestGroups.respondentUserId,
    })
    .from(guestGroups)
    .where(eq(guestGroups.token, token))
    .limit(1);

  if (group.length === 0) {
    return { linked: false, reason: "not_found" };
  }

  if (group[0].respondentUserId === userId) {
    return { linked: true, reason: "already_linked", linkedToken: group[0].token };
  }

  if (group[0].respondentUserId) {
    return { linked: false, reason: "claimed_by_other" };
  }

  if (options?.allowMergeWithExisting) {
    const existingLinked = await db
      .select({ id: guestGroups.id, token: guestGroups.token })
      .from(guestGroups)
      .where(
        and(
          eq(guestGroups.invitationId, group[0].invitationId),
          eq(guestGroups.respondentUserId, userId)
        )
      )
      .limit(1);

    if (existingLinked.length > 0) {
      const primaryGroup = existingLinked[0];
      const claimedGroupId = group[0].id;

      const claimedResponses = await db
        .select({
          optionKey: rsvpResponses.optionKey,
          adults: rsvpResponses.adults,
          kids: rsvpResponses.kids,
          total: rsvpResponses.total,
          message: rsvpResponses.message,
          respondedByUserId: rsvpResponses.respondedByUserId,
        })
        .from(rsvpResponses)
        .where(eq(rsvpResponses.groupId, claimedGroupId))
        .orderBy(desc(rsvpResponses.updatedAt))
        .limit(1);

      if (claimedResponses.length > 0) {
        await db.delete(rsvpResponses).where(eq(rsvpResponses.groupId, primaryGroup.id));
        await db.insert(rsvpResponses).values({
          id: crypto.randomUUID(),
          groupId: primaryGroup.id,
          optionKey: claimedResponses[0].optionKey,
          adults: claimedResponses[0].adults,
          kids: claimedResponses[0].kids,
          total: claimedResponses[0].total,
          message: claimedResponses[0].message,
          respondedByUserId: claimedResponses[0].respondedByUserId ?? userId,
        });
      }

      await db.update(guests).set({ groupId: primaryGroup.id }).where(eq(guests.groupId, claimedGroupId));
      await db.delete(rsvpResponses).where(eq(rsvpResponses.groupId, claimedGroupId));
      await db.delete(guestGroups).where(eq(guestGroups.id, claimedGroupId));

      return {
        linked: true,
        reason: "merged_to_existing",
        linkedToken: primaryGroup.token,
      };
    }
  }

  const updated = await db
    .update(guestGroups)
    .set({ respondentUserId: userId })
    .where(and(eq(guestGroups.id, group[0].id), isNull(guestGroups.respondentUserId)));

  return {
    linked: updated.rowsAffected > 0,
    reason: "linked",
    linkedToken: group[0].token,
  };
}
