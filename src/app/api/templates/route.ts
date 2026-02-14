import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { templateGallery } from "@/db/schema";
import { defaultTemplateGallery } from "@/lib/template-gallery";
import { getSessionUser } from "@/lib/session";

type TemplatePayload = {
  name?: string;
  url?: string;
  thumbnailUrl?: string | null;
  repoUrl?: string | null;
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
    }));
    await db.insert(templateGallery).values(seeded);
    templates = seeded.map((template) => ({
      id: template.id,
      name: template.name,
      url: template.url,
      thumbnailUrl: template.thumbnailUrl ?? null,
      repoUrl: template.repoUrl ?? null,
    }));
  }

  return NextResponse.json({ templates });
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
  };

  await db.insert(templateGallery).values(record);

  return NextResponse.json({
    template: {
      id: record.id,
      name: record.name,
      url: record.url,
      thumbnailUrl: record.thumbnailUrl,
      repoUrl: record.repoUrl,
    },
  });
}
