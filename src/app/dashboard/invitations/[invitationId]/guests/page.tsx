"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type GuestGroup = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  expectedAdults: number;
  expectedKids: number;
  expectedTotal: number;
  openCount: boolean;
  token: string;
};

export default function GuestListPage() {
  const params = useParams();
  const invitationId = typeof params.invitationId === "string" ? params.invitationId : "";
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);
  const [guestForm, setGuestForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    expectedAdults: "0",
    expectedKids: "0",
    expectedTotal: "0",
    openCount: false,
  });
  const [guestMessage, setGuestMessage] = useState("");
  const [guestSaving, setGuestSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!invitationId) return;
      const response = await fetch(`/api/invitations/${invitationId}/guest-groups`);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const guestData = await response.json();
        if (response.ok) {
          setGuestGroups(guestData.guestGroups ?? []);
        }
      }
    }

    load();
  }, [invitationId]);

  async function handleGuestSubmit(event: React.FormEvent) {
    event.preventDefault();
    setGuestSaving(true);
    setGuestMessage("");

    const response = await fetch(`/api/invitations/${invitationId}/guest-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: guestForm.displayName,
        email: guestForm.email,
        phone: guestForm.phone,
        expectedAdults: Number(guestForm.expectedAdults),
        expectedKids: Number(guestForm.expectedKids),
        expectedTotal: Number(guestForm.expectedTotal),
        openCount: guestForm.openCount,
      }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    let data: { error?: string; id?: string; token?: string } = {};
    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      setGuestMessage(data.error ?? "Failed to add guest");
      setGuestSaving(false);
      return;
    }

    setGuestGroups((prev) => [
      ...prev,
      {
        id: data.id ?? crypto.randomUUID(),
        displayName: guestForm.displayName,
        email: guestForm.email || null,
        phone: guestForm.phone || null,
        expectedAdults: Number(guestForm.expectedAdults),
        expectedKids: Number(guestForm.expectedKids),
        expectedTotal: Number(guestForm.expectedTotal),
        openCount: guestForm.openCount,
        token: data.token ?? "",
      },
    ]);

    setGuestForm({
      displayName: "",
      email: "",
      phone: "",
      expectedAdults: "0",
      expectedKids: "0",
      expectedTotal: "0",
      openCount: false,
    });
    setGuestMessage("Guest added.");
    setGuestSaving(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Guest list
            </p>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[0.12em]">
              Manage guests
            </h1>
          </div>
          <a
            className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
            href={`/dashboard/invitations/${invitationId}`}
          >
            Back to invite
          </a>
        </header>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.1em]">
              Add a guest group
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {guestGroups.length} groups
            </span>
          </div>

          <form onSubmit={handleGuestSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Guest group name
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={guestForm.displayName}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, displayName: event.target.value }))
                }
                placeholder="The Parkers"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Email
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={guestForm.email}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, email: event.target.value }))
                }
                placeholder="guest@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Adults
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                type="number"
                min="0"
                value={guestForm.expectedAdults}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, expectedAdults: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Kids
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                type="number"
                min="0"
                value={guestForm.expectedKids}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, expectedKids: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Total
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                type="number"
                min="0"
                value={guestForm.expectedTotal}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, expectedTotal: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Phone
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={guestForm.phone}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, phone: event.target.value }))
                }
                placeholder="(555) 555-5555"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={guestForm.openCount}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, openCount: event.target.checked }))
                }
              />
              <span className="text-sm text-[var(--muted)]">Allow open count</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black"
                disabled={guestSaving}
              >
                {guestSaving ? "Adding..." : "Add guest"}
              </button>
              {guestMessage ? (
                <span className="text-sm text-[var(--muted)]">{guestMessage}</span>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid gap-4">
          {guestGroups.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No guests added yet.</p>
          ) : (
            guestGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-white/15 bg-white/5 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {group.displayName}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {group.email ?? "No email"}
                    </p>
                  </div>
                  <a
                    className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
                    href={`/i/${group.token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open guest link
                  </a>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-3">
                  <span>Adults: {group.expectedAdults}</span>
                  <span>Kids: {group.expectedKids}</span>
                  <span>Total: {group.expectedTotal}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
