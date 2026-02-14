import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { templateGallery } from "@/db/schema";
import { getSessionUser } from "@/lib/session";

type TemplatePayload = {
  name?: string;
  url?: string;
  thumbnailUrl?: string | null;
  repoUrl?: string | null;
};

type RouteParams = {
  params: Promise<{ templateId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = await params;

  const body = (await request.json()) as TemplatePayload;
  const updates: Partial<{
    name: string;
    url: string;
    thumbnailUrl: string | null;
    repoUrl: string | null;
  }> = {};

  if ("name" in body) {
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    updates.name = name;
  }

  if ("url" in body) {
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }
    updates.url = url;
  }

  if ("thumbnailUrl" in body) {
    updates.thumbnailUrl = body.thumbnailUrl?.trim() || null;
  }

  if ("repoUrl" in body) {
    updates.repoUrl = body.repoUrl?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  await db
    .update(templateGallery)
    .set(updates)
    .where(
      and(eq(templateGallery.id, templateId), eq(templateGallery.ownerUserId, user.id))
    );

  const updated = await db
    .select({
      id: templateGallery.id,
      name: templateGallery.name,
      url: templateGallery.url,
      thumbnailUrl: templateGallery.thumbnailUrl,
      repoUrl: templateGallery.repoUrl,
    })
    .from(templateGallery)
    .where(
      and(eq(templateGallery.id, templateId), eq(templateGallery.ownerUserId, user.id))
    )
    .limit(1);

  if (!updated[0]) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ template: updated[0] });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { templateId } = await params;

  await db
    .delete(templateGallery)
    .where(
      and(eq(templateGallery.id, templateId), eq(templateGallery.ownerUserId, user.id))
    );

  return NextResponse.json({ success: true });
}
