import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TemplateGalleryClient from "./TemplateGalleryClient";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";
import { db } from "@/db/client";
import { templateGallery } from "@/db/schema";
import { defaultTemplateGallery } from "@/lib/template-gallery";
import { parseStoredTags, serializeTags } from "@/lib/template-tags";
import { eq, asc } from "drizzle-orm";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

export default async function TemplateGalleryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/auth");
  }

  const user = await getSessionUserByToken(token);

  if (!user) {
    redirect("/auth");
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

  const templatesWithPermissions = templates.map((template) => ({
    ...template,
    tags: parseStoredTags(template.tags ?? null),
    canEdit: template.submittedByUserId === user.id,
  }));

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Template gallery
            </p>
            <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
              Pick a starting point
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              Browse the templates we have on file. Copy the URL into a new invitation
              or preview how guest and open RSVP data render.
            </p>
          </div>
        </header>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-[var(--muted)]">
            No templates registered yet.
          </div>
        ) : (
          <TemplateGalleryClient templates={templatesWithPermissions} />
        )}
      </main>
    </div>
  );
}
