import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invitationHostMessages, invitationHosts } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type Payload = {
  message?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  const { invitationId } = await params;
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = await db
    .select({ id: invitationHosts.id })
    .from(invitationHosts)
    .where(
      and(
        eq(invitationHosts.invitationId, invitationId),
        eq(invitationHosts.userId, user.id)
      )
    )
    .limit(1);
  if (host.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as Payload;
  const message = body.message?.trim() ?? "";
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 500) {
    return NextResponse.json({ error: "Message must be 500 characters or less" }, { status: 400 });
  }

  const createdAt = new Date();
  const id = crypto.randomUUID();
  await db.insert(invitationHostMessages).values({
    id,
    invitationId,
    userId: user.id,
    message,
    createdAt,
  });

  return NextResponse.json({
    message: {
      id,
      groupId: null,
      message,
      createdAt,
      authorName: user.displayName || user.email,
      authorRole: "host",
    },
  });
}
