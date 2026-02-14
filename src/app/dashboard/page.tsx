import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";
import { db } from "@/db/client";
import {
  guestGroups,
  invitationDetails,
  invitationHosts,
  invitations,
  rsvpResponses,
} from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";
import { formatDate, formatTime } from "@/lib/date-format";

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
      eventDate: invitationDetails.eventDate,
      eventTime: invitationDetails.eventTime,
      date: invitationDetails.date,
      time: invitationDetails.time,
      dateFormat: invitationDetails.dateFormat,
      timeFormat: invitationDetails.timeFormat,
    })
    .from(invitations)
    .innerJoin(
      invitationHosts,
      and(
        eq(invitationHosts.invitationId, invitations.id),
        eq(invitationHosts.userId, user.id)
      )
    )
    .leftJoin(invitationDetails, eq(invitationDetails.invitationId, invitations.id))
    .orderBy(desc(invitations.createdAt));

  const groupStats = await db
    .select({
      invitationId: guestGroups.invitationId,
      groupCount: sql<number>`count(*)`,
      expectedTotal: sql<number>`coalesce(sum(${guestGroups.expectedTotal}), 0)`,
    })
    .from(guestGroups)
    .groupBy(guestGroups.invitationId);

  const responseStats = await db
    .select({
      invitationId: guestGroups.invitationId,
      responseCount: sql<number>`count(${rsvpResponses.id})`,
      respondedTotal: sql<number>`coalesce(sum(${rsvpResponses.total}), 0)`,
    })
    .from(rsvpResponses)
    .innerJoin(guestGroups, eq(rsvpResponses.groupId, guestGroups.id))
    .groupBy(guestGroups.invitationId);

  const groupStatsMap = new Map(
    groupStats.map((stat) => [stat.invitationId, stat])
  );
  const responseStatsMap = new Map(
    responseStats.map((stat) => [stat.invitationId, stat])
  );

  function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseEventDate(value: string | null) {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  const today = startOfDay(new Date());
  const upcomingInvitations = userInvitations.filter((invite) => {
    const dateValue = invite.eventDate ?? invite.date ?? null;
    const parsed = parseEventDate(dateValue);
    if (!parsed) return true;
    return parsed >= today;
  });
  const pastInvitations = userInvitations.filter((invite) => {
    const dateValue = invite.eventDate ?? invite.date ?? null;
    const parsed = parseEventDate(dateValue);
    if (!parsed) return false;
    return parsed < today;
  });

  function formatEventDateTime(invite: (typeof userInvitations)[number]) {
    const dateValue = invite.eventDate ?? invite.date ?? null;
    const timeValue = invite.eventTime ?? invite.time ?? null;
    const formattedDate = formatDate(
      dateValue,
      (invite.dateFormat ?? "MMM d, yyyy") as
        | "MMM d, yyyy"
        | "MMMM d, yyyy"
        | "EEE, MMM d"
        | "yyyy-MM-dd"
    );
    const formattedTime = formatTime(
      timeValue,
      (invite.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
    );
    if (formattedDate && formattedTime) return `${formattedDate} · ${formattedTime}`;
    return formattedDate ?? formattedTime ?? "";
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.1em]">
              Upcoming events
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {upcomingInvitations.length} upcoming
            </span>
          </div>
          {upcomingInvitations.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-[var(--muted)]">
              No upcoming invitations yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {upcomingInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6"
                >
                  <h3 className="font-[var(--font-display)] text-2xl tracking-[0.1em]">
                    {invite.title}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {formatEventDateTime(invite)}
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
                        href={`/preview-client/${invite.previewToken}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Responses: {responseStatsMap.get(invite.id)?.responseCount ?? 0} /{" "}
                      {groupStatsMap.get(invite.id)?.groupCount ?? 0} groups
                    </span>
                    <span>
                      Guests: {responseStatsMap.get(invite.id)?.respondedTotal ?? 0} /{" "}
                      {groupStatsMap.get(invite.id)?.expectedTotal ?? 0} expected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.1em]">
              Past events
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {pastInvitations.length} past
            </span>
          </div>
          {pastInvitations.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-[var(--muted)]">
              No past invitations yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {pastInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6"
                >
                  <h3 className="font-[var(--font-display)] text-2xl tracking-[0.1em]">
                    {invite.title}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {formatEventDateTime(invite)}
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
                        href={`/preview-client/${invite.previewToken}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
                    <span>
                      Responses: {responseStatsMap.get(invite.id)?.responseCount ?? 0} /{" "}
                      {groupStatsMap.get(invite.id)?.groupCount ?? 0} groups
                    </span>
                    <span>
                      Guests: {responseStatsMap.get(invite.id)?.respondedTotal ?? 0} /{" "}
                      {groupStatsMap.get(invite.id)?.expectedTotal ?? 0} expected
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
