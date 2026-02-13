import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { hostInvites, invitationHosts } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

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

  const token = crypto.randomUUID();
  await db.insert(hostInvites).values({
    id: crypto.randomUUID(),
    invitationId,
    token,
  });

  return NextResponse.json({ token });
}
