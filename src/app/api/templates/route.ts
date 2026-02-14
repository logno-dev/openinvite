import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { templateGallery } from "@/db/schema";
import { defaultTemplateGallery } from "@/lib/template-gallery";
import { parseStoredTags, parseTagsInput, serializeTags } from "@/lib/template-tags";
import { getSessionUser } from "@/lib/session";

type TemplatePayload = {
  name?: string;
  url?: string;
  thumbnailUrl?: string | null;
  repoUrl?: string | null;
  tags?: string[] | string | null;
};

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let templates = await db
    .select({
      id: templateGallery.id,
      name: templateGallery.name,
      url: templateGallery.url,
      thumbnailUrl: templateGallery.thumbnailUrl,
      repoUrl: templateGallery.repoUrl,
      submittedBy: templateGallery.submittedBy,
      submittedByUserId: templateGallery.submittedByUserId,
      tags: templateGallery.tags,
    })
    .from(templateGallery)
    .where(eq(templateGallery.ownerUserId, user.id))
    .orderBy(asc(templateGallery.createdAt));

  if (templates.length === 0 && defaultTemplateGallery.length > 0) {
    const seeded = defaultTemplateGallery.map((template) => ({
      id: crypto.randomUUID(),
      ownerUserId: user.id,
      name: template.name,
      url: template.url,
      thumbnailUrl: template.thumbnailUrl ?? null,
      repoUrl: template.repoUrl ?? null,
      submittedBy: template.submittedBy ?? "OpenInvite",
      submittedByUserId: null,
      tags: serializeTags(template.tags ?? null),
    }));
    await db.insert(templateGallery).values(seeded);
    templates = seeded.map((template) => ({
      id: template.id,
      name: template.name,
      url: template.url,
      thumbnailUrl: template.thumbnailUrl ?? null,
      repoUrl: template.repoUrl ?? null,
      submittedBy: template.submittedBy ?? null,
      submittedByUserId: template.submittedByUserId ?? null,
      tags: template.tags ?? null,
    }));
  }

  return NextResponse.json({
    templates: templates.map((template) => ({
      ...template,
      tags: parseStoredTags(template.tags ?? null),
      canEdit: template.submittedByUserId === user.id,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as TemplatePayload;
  const name = body.name?.trim();
  const url = body.url?.trim();

  if (!name || !url) {
    return NextResponse.json({ error: "Name and URL required" }, { status: 400 });
  }

  const record = {
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    name,
    url,
    thumbnailUrl: body.thumbnailUrl?.trim() || null,
    repoUrl: body.repoUrl?.trim() || null,
    submittedBy: user.displayName ?? user.email ?? "You",
    submittedByUserId: user.id,
    tags: serializeTags(parseTagsInput(body.tags)),
  };

  await db.insert(templateGallery).values(record);

  return NextResponse.json({
    template: {
      id: record.id,
      name: record.name,
      url: record.url,
      thumbnailUrl: record.thumbnailUrl,
      repoUrl: record.repoUrl,
      submittedBy: record.submittedBy,
      submittedByUserId: record.submittedByUserId,
      tags: parseStoredTags(record.tags ?? null),
      canEdit: true,
    },
  });
}
