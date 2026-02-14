import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";

type UpdatePayload = {
  displayName?: string;
  phone?: string;
  shareEmailWithGuests?: boolean;
};

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      phone: users.phone,
      shareEmailWithGuests: users.shareEmailWithGuests,
    })
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .limit(1);

  if (record.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ settings: record[0] });
}

export async function PATCH(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpdatePayload;
  const update: {
    displayName?: string | null;
    phone?: string | null;
    shareEmailWithGuests?: boolean;
  } = {};

  if (body.displayName !== undefined) {
    update.displayName = body.displayName.trim() || null;
  }
  if (body.phone !== undefined) {
    update.phone = body.phone.trim() || null;
  }
  if (body.shareEmailWithGuests !== undefined) {
    update.shareEmailWithGuests = body.shareEmailWithGuests;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await db.update(users).set(update).where(eq(users.id, sessionUser.id));

  return NextResponse.json({ ok: true });
}
