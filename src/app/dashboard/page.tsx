import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";
import { db } from "@/db/client";
import { invitationHosts, invitations } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/auth");
  }

  const user = await getSessionUserByToken(token);

  if (!user) {
    redirect("/auth");
  }

  const userInvitations = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      templateUrlLive: invitations.templateUrlLive,
      previewToken: invitations.previewToken,
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
    .orderBy(desc(invitations.createdAt));

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.1em]">
              Invitations
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {userInvitations.length} total
            </span>
          </div>
          {userInvitations.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-[var(--muted)]">
              No invitations yet. Create your first invite to get started.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {userInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6"
                >
                  <h3 className="font-[var(--font-display)] text-2xl tracking-[0.1em]">
                    {invite.title}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {invite.createdAt?.toString?.() ?? ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    <a
                      className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                      href={`/dashboard/invitations/${invite.id}`}
                    >
                      Edit details
                    </a>
                    <a
                      className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                      href={`/dashboard/invitations/${invite.id}/guests`}
                    >
                      Manage guests
                    </a>
                    {invite.previewToken ? (
                      <a
                        className="rounded-full border border-white/25 bg-white/5 px-4 py-2"
                        href={`/preview/${invite.previewToken}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Draft URL: {invite.templateUrlDraft ?? "Not set"}
                    </span>
                    <span>
                      Live URL: {invite.templateUrlLive ?? "Not set"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
