"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

type RespondentInvitation = {
  groupId: string;
  guestToken: string;
  displayName: string;
  invitationId: string;
  invitationTitle: string;
  countMode: "split" | "total";
  response: {
    optionKey: string;
    optionLabel: string;
    adults: number;
    kids: number;
    total: number;
    message: string | null;
    updatedAt: string | null;
  } | null;
};

export default function MyInvitationsPage() {
  const [invitations, setInvitations] = useState<RespondentInvitation[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/respondent/invitations");
      if (response.status === 401) {
        window.location.href = "/auth?next=/my-invitations";
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setMessage("Failed to load invitations");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Failed to load invitations");
        return;
      }

      setInvitations(data.invitations ?? []);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Guest account
          </p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[0.12em] sm:text-5xl">
            Your invitations
          </h1>
          <p className="max-w-2xl text-sm text-[var(--muted)]">
            Review the events you are linked to and open each invitation to update your
            RSVP.
          </p>
        </header>

        {message ? <p className="text-sm text-rose-300">{message}</p> : null}

        {invitations.length === 0 ? (
          <section className="rounded-2xl border border-white/15 bg-white/5 p-6 text-sm text-[var(--muted)]">
            You do not have any linked invitations yet. Open a guest invitation link and
            submit your RSVP while signed in to attach it to your account.
          </section>
        ) : (
          <section className="grid gap-4">
            {invitations.map((item) => (
              <article
                key={item.groupId}
                className="rounded-2xl border border-white/15 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {item.displayName}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-[var(--foreground)]">
                      {item.invitationTitle}
                    </h2>
                  </div>
                  <a
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.15em]"
                    href={`/i/${item.guestToken}`}
                  >
                    Open invitation
                  </a>
                </div>
                <div className="mt-3 text-sm text-[var(--muted)]">
                  {item.response ? (
                    item.countMode === "split" ? (
                      <span>
                        RSVP: {item.response.optionLabel} · Adults: {item.response.adults} ·
                        Kids: {item.response.kids} · Total: {item.response.total}
                      </span>
                    ) : (
                      <span>
                        RSVP: {item.response.optionLabel} · Total: {item.response.total}
                      </span>
                    )
                  ) : (
                    <span>RSVP: Not submitted yet</span>
                  )}
                </div>
                {item.response?.message ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Message: {item.response.message}</p>
                ) : null}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
