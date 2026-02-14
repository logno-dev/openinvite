"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

type GuestListItem = {
  groupId: string;
  displayName: string;
  optionKey: string;
  optionLabel: string;
  adults: number;
  kids: number;
  total: number;
  updatedAt: string | null;
};

type GuestMessage = {
  id: string;
  groupId: string;
  message: string;
  createdAt: string | null;
  authorName: string;
};

type GuestListPayload = {
  invitationTitle: string;
  countMode: "split" | "total";
  guestList: GuestListItem[];
  messages: GuestMessage[];
};

export default function InvitationGuestListPage() {
  const params = useParams();
  const guestToken = typeof params.guestToken === "string" ? params.guestToken : "";
  const [data, setData] = useState<GuestListPayload | null>(null);
  const [message, setMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!guestToken) return;
      const response = await fetch(`/api/respondent/invitations/${guestToken}/guests`);
      if (response.status === 401) {
        window.location.href = `/auth?next=/my-invitations/${guestToken}/guests`;
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setMessage("Failed to load guest list");
        return;
      }

      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Failed to load guest list");
        return;
      }

      setData(payload as GuestListPayload);
    }

    load();
  }, [guestToken]);

  const totals = useMemo(() => {
    if (!data) return { adults: 0, kids: 0, total: 0, responses: 0 };
    return data.guestList.reduce(
      (acc, item) => {
        acc.adults += item.adults;
        acc.kids += item.kids;
        acc.total += item.total;
        acc.responses += 1;
        return acc;
      },
      { adults: 0, kids: 0, total: 0, responses: 0 }
    );
  }, [data]);

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !guestToken) return;
    setSending(true);
    const response = await fetch(`/api/respondent/invitations/${guestToken}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) {
      setMessage((payload as { error?: string }).error ?? "Failed to send message");
      setSending(false);
      return;
    }

    setData((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, (payload as { message: GuestMessage }).message],
          }
        : prev
    );
    setChatInput("");
    setSending(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Guest list
          </p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[0.12em] sm:text-5xl">
            {data?.invitationTitle ?? "Invitation guests"}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {totals.responses} responses · Adults: {totals.adults} · Kids: {totals.kids} ·
            Total attending: {totals.total}
          </p>
        </header>

        {message ? <p className="text-sm text-rose-300">{message}</p> : null}

        <section className="grid gap-3 rounded-2xl border border-white/15 bg-white/5 p-5">
          {data?.guestList?.length ? (
            data.guestList.map((guest) => (
              <article
                key={guest.groupId}
                className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-[var(--foreground)]">{guest.displayName}</p>
                <p className="text-[var(--muted)]">
                  RSVP: {guest.optionLabel}
                  {data.countMode === "split"
                    ? ` · Adults: ${guest.adults} · Kids: ${guest.kids} · Total: ${guest.total}`
                    : ` · Total: ${guest.total}`}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-[var(--muted)]">No RSVPs have been submitted yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <h2 className="font-[var(--font-display)] text-3xl tracking-[0.08em]">Guest chat</h2>
          <div className="mt-4 grid max-h-[320px] gap-3 overflow-y-auto pr-1">
            {data?.messages?.length ? (
              data.messages.map((entry) => (
                <article key={entry.id} className="rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {entry.authorName}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{entry.message}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No messages yet. Start the conversation.</p>
            )}
          </div>
          <form onSubmit={submitMessage} className="mt-4 grid gap-3">
            <textarea
              className="min-h-[90px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              maxLength={500}
              placeholder="Share plans, ride details, or coordinate with the group"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-fit rounded-full border border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--accent)]"
            >
              {sending ? "Sending..." : "Send message"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
