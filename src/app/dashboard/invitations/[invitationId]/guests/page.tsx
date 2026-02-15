"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

type GuestGroup = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  expectedAdults: number;
  expectedKids: number;
  expectedTotal: number;
  openCount: boolean;
  inviteEmailSentAt?: string | null;
  inviteEmailLastType?: string | null;
  token: string;
  response?: {
    optionKey: string;
    adults: number;
    kids: number;
    total: number;
    message: string | null;
    updatedAt: string | null;
  } | null;
};

type GuestChatMessage = {
  id: string;
  groupId: string | null;
  message: string;
  createdAt: string | null;
  authorName: string;
  authorRole?: "guest" | "host";
};

export default function GuestListPage() {
  const params = useParams();
  const invitationId = typeof params.invitationId === "string" ? params.invitationId : "";
  const [guestGroups, setGuestGroups] = useState<GuestGroup[]>([]);
  const [chatMessages, setChatMessages] = useState<GuestChatMessage[]>([]);
  const [countMode, setCountMode] = useState<"split" | "total">("split");
  const [rsvpOptions, setRsvpOptions] = useState<Array<{ key: string; label: string }>>(
    []
  );
  const [openRsvpToken, setOpenRsvpToken] = useState<string | null>(null);
  const [openCopyState, setOpenCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [guestCopyState, setGuestCopyState] = useState<Record<string, "idle" | "copied" | "error">>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    notes: "",
    expectedAdults: "0",
    expectedKids: "0",
    expectedTotal: "0",
    openCount: false,
  });
  const [responseForm, setResponseForm] = useState({
    optionKey: "",
    adults: "0",
    kids: "0",
    total: "0",
    message: "",
  });
  const [guestForm, setGuestForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    notes: "",
    expectedAdults: "0",
    expectedKids: "0",
    expectedTotal: "0",
    openCount: false,
  });
  const [guestMessage, setGuestMessage] = useState("");
  const [guestSaving, setGuestSaving] = useState(false);
  const [emailSendState, setEmailSendState] = useState<
    Record<string, "idle" | "sending" | "sent" | "error">
  >({});
  const [bulkSendLoading, setBulkSendLoading] = useState(false);
  const [bulkSendIncludeSent, setBulkSendIncludeSent] = useState(false);
  const [hostChatInput, setHostChatInput] = useState("");
  const [hostChatSending, setHostChatSending] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!invitationId) return;
      const response = await fetch(`/api/invitations/${invitationId}/guest-groups`);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const guestData = await response.json();
        if (response.ok) {
          setGuestGroups(guestData.guestGroups ?? []);
          setCountMode(guestData.countMode ?? "split");
          setRsvpOptions(guestData.rsvpOptions ?? []);
          setOpenRsvpToken(guestData.openRsvpToken ?? null);
          setChatMessages(guestData.messages ?? []);
        }
      }
    }

    load();
  }, [invitationId]);

  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-guest-actions-root='true']")) return;
      setActionMenuOpenId(null);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActionMenuOpenId(null);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleGuestSubmit(event: React.FormEvent) {
    event.preventDefault();
    const adults = countMode === "split" ? Number(guestForm.expectedAdults) : 0;
    const kids = countMode === "split" ? Number(guestForm.expectedKids) : 0;
    const total =
      countMode === "total"
        ? Number(guestForm.expectedTotal)
        : Number(guestForm.expectedAdults) + Number(guestForm.expectedKids);

    if (guestForm.openCount) {
      const hasMinimum = countMode === "total" ? total >= 1 : adults + kids >= 1;
      if (!hasMinimum) {
        setGuestMessage(
          countMode === "total"
            ? "Open count requires expected total of at least 1"
            : "Open count requires at least 1 adult or child"
        );
        return;
      }
    }

    setGuestSaving(true);
    setGuestMessage("");

    const response = await fetch(`/api/invitations/${invitationId}/guest-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: guestForm.displayName,
        email: guestForm.email,
        phone: guestForm.phone,
        notes: guestForm.notes,
        expectedAdults: adults,
        expectedKids: kids,
        expectedTotal: total,
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
        notes: guestForm.notes || null,
        expectedAdults: adults,
        expectedKids: kids,
        expectedTotal: total,
        openCount: guestForm.openCount,
        token: data.token ?? "",
      },
    ]);

    setGuestForm({
      displayName: "",
      email: "",
      phone: "",
      notes: "",
      expectedAdults: "0",
      expectedKids: "0",
      expectedTotal: "0",
      openCount: false,
    });
    setGuestMessage("Guest added.");
    setGuestSaving(false);
  }

  function startEdit(group: GuestGroup) {
    setEditingId(group.id);
    setEditForm({
      displayName: group.displayName,
      email: group.email ?? "",
      phone: group.phone ?? "",
      notes: group.notes ?? "",
      expectedAdults: String(group.expectedAdults),
      expectedKids: String(group.expectedKids),
      expectedTotal: String(group.expectedTotal),
      openCount: group.openCount,
    });
    setResponseForm({
      optionKey: group.response?.optionKey ?? "",
      adults: String(group.response?.adults ?? 0),
      kids: String(group.response?.kids ?? 0),
      total: String(group.response?.total ?? 0),
      message: group.response?.message ?? "",
    });
  }

  async function saveEdit(groupId: string) {
    const response = await fetch(
      `/api/invitations/${invitationId}/guest-groups/${groupId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editForm.displayName,
          email: editForm.email,
          phone: editForm.phone,
          notes: editForm.notes,
          expectedAdults: countMode === "split" ? Number(editForm.expectedAdults) : 0,
          expectedKids: countMode === "split" ? Number(editForm.expectedKids) : 0,
          expectedTotal:
            countMode === "total"
              ? Number(editForm.expectedTotal)
              : Number(editForm.expectedAdults) + Number(editForm.expectedKids),
          openCount: editForm.openCount,
        }),
      }
    );

    if (!response.ok) {
      setGuestMessage("Failed to update guest");
      return;
    }

    setGuestGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              displayName: editForm.displayName,
              email: editForm.email || null,
              phone: editForm.phone || null,
              notes: editForm.notes || null,
              expectedAdults:
                countMode === "split" ? Number(editForm.expectedAdults) : 0,
              expectedKids:
                countMode === "split" ? Number(editForm.expectedKids) : 0,
              expectedTotal:
                countMode === "total"
                  ? Number(editForm.expectedTotal)
                  : Number(editForm.expectedAdults) + Number(editForm.expectedKids),
              openCount: editForm.openCount,
            }
          : group
      )
    );
    setEditingId(null);
  }

  async function saveResponse(groupId: string) {
    if (!responseForm.optionKey) {
      setGuestMessage("Select a response option");
      return;
    }

    const response = await fetch(
      `/api/invitations/${invitationId}/guest-groups/${groupId}/response`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionKey: responseForm.optionKey,
          adults: Number(responseForm.adults),
          kids: Number(responseForm.kids),
          total: Number(responseForm.total),
          message: responseForm.message,
        }),
      }
    );

    if (!response.ok) {
      setGuestMessage("Failed to record response");
      return;
    }

    const adults = Number(responseForm.adults);
    const kids = Number(responseForm.kids);
    const total =
      countMode === "total" ? Number(responseForm.total) : adults + kids;
    setGuestGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              response: {
                optionKey: responseForm.optionKey,
                adults,
                kids,
                total,
                message: responseForm.message || null,
                updatedAt: new Date().toISOString(),
              },
            }
          : group
      )
    );
    setEditingId(null);
  }

  async function deleteGuest(groupId: string, displayName: string) {
    const confirmed = window.confirm(`Delete ${displayName} from the guest list?`);
    if (!confirmed) return;
    const response = await fetch(
      `/api/invitations/${invitationId}/guest-groups/${groupId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      setGuestMessage("Failed to delete guest");
      return;
    }

    setGuestGroups((prev) => prev.filter((group) => group.id !== groupId));
    if (editingId === groupId) {
      setEditingId(null);
    }
    setGuestMessage("Guest removed.");
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      return false;
    }
  }

  async function sendGuestEmail(group: GuestGroup, mode: "invite" | "update") {
    if (!group.email) {
      setGuestMessage("Add an email address for this guest first.");
      return;
    }

    setEmailSendState((prev) => ({ ...prev, [group.id]: "sending" }));
    const response = await fetch(
      `/api/invitations/${invitationId}/guest-groups/${group.id}/send?mode=${mode}`,
      { method: "POST" }
    );
    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) {
      setEmailSendState((prev) => ({ ...prev, [group.id]: "error" }));
      setGuestMessage(data.error ?? "Failed to send invitation email");
      setTimeout(
        () => setEmailSendState((prev) => ({ ...prev, [group.id]: "idle" })),
        1800
      );
      return;
    }

    setEmailSendState((prev) => ({ ...prev, [group.id]: "sent" }));
    setGuestGroups((prev) =>
      prev.map((item) =>
        item.id === group.id
          ? {
              ...item,
              inviteEmailSentAt: new Date().toISOString(),
              inviteEmailLastType: mode,
            }
          : item
      )
    );
    setTimeout(
      () => setEmailSendState((prev) => ({ ...prev, [group.id]: "idle" })),
      1800
    );
  }

  async function sendAllEmails(mode: "invite" | "update") {
    setBulkSendLoading(true);
    setGuestMessage("");
    const response = await fetch(`/api/invitations/${invitationId}/guest-groups/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ includeAlreadySent: bulkSendIncludeSent, mode }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) {
      setGuestMessage(data.error ?? "Failed to send emails");
      setBulkSendLoading(false);
      return;
    }
    const now = new Date().toISOString();
    if (bulkSendIncludeSent || mode === "update") {
      setGuestGroups((prev) =>
        prev.map((group) =>
          group.email
            ? {
                ...group,
                inviteEmailSentAt: now,
                inviteEmailLastType: mode,
              }
            : group
        )
      );
    } else {
      setGuestGroups((prev) =>
        prev.map((group) =>
          group.email && !group.inviteEmailSentAt
            ? {
                ...group,
                inviteEmailSentAt: now,
                inviteEmailLastType: mode,
              }
            : group
        )
      );
    }
    setGuestMessage(`Sent ${data.sentCount ?? 0} email${data.sentCount === 1 ? "" : "s"}.`);
    setBulkSendLoading(false);
  }

  async function submitHostMessage(event: React.FormEvent) {
    event.preventDefault();
    const message = hostChatInput.trim();
    if (!message) return;
    setHostChatSending(true);
    const response = await fetch(`/api/invitations/${invitationId}/guest-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) {
      setGuestMessage(data.error ?? "Failed to post message");
      setHostChatSending(false);
      return;
    }
    setChatMessages((prev) => [...prev, data.message as GuestChatMessage]);
    setHostChatInput("");
    setHostChatSending(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Guest list
            </p>
            <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
              Manage guests
            </h1>
          </div>
        </header>

        <section className="grid gap-3">
          {(() => {
            const defaultOptions = [
              { key: "yes", label: "Yes" },
              { key: "no", label: "No" },
              { key: "maybe", label: "Maybe" },
            ];
            const options = rsvpOptions.length > 0 ? rsvpOptions : defaultOptions;
            const summary = new Map(
              options.map((option) => [
                option.key,
                { label: option.label, adults: 0, kids: 0, total: 0 },
              ])
            );
            summary.set("no_response", {
              label: "No response",
              adults: 0,
              kids: 0,
              total: 0,
            });

            guestGroups.forEach((group) => {
              if (!group.response) {
                const entry = summary.get("no_response");
                if (!entry) return;
                entry.adults += group.expectedAdults;
                entry.kids += group.expectedKids;
                entry.total += group.expectedTotal;
                return;
              }
              const entry = summary.get(group.response.optionKey);
              if (!entry) return;
              entry.adults += group.response.adults;
              entry.kids += group.response.kids;
              entry.total += group.response.total;
            });

            const rows = Array.from(summary.entries()).map(([key, entry]) => ({
              key,
              ...entry,
              isYes: key.toLowerCase() === "yes",
            }));

            return (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-white/15 bg-white/5 md:block">
                  <div className="grid grid-cols-4 border-b border-white/10 bg-black/10 px-4 py-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    <span>Response</span>
                    <span>{countMode === "split" ? "Adults" : "Count"}</span>
                    <span>{countMode === "split" ? "Kids" : ""}</span>
                    <span>Total</span>
                  </div>
                  {rows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-4 items-center border-b border-white/10 px-4 py-3 last:border-b-0"
                    >
                      <span className="text-sm text-[var(--foreground)]">{row.label}</span>
                      <span className={`font-semibold ${row.isYes ? "text-2xl text-[var(--accent)]" : "text-lg"}`}>
                        {countMode === "split" ? row.adults : row.total}
                      </span>
                      <span className={`font-semibold ${row.isYes ? "text-2xl text-[var(--accent)]" : "text-lg"}`}>
                        {countMode === "split" ? row.kids : "-"}
                      </span>
                      <span className={`font-semibold ${row.isYes ? "text-3xl text-[var(--accent)]" : "text-xl"}`}>
                        {row.total}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 md:hidden">
                  {rows.map((row) => (
                    <div key={row.key} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">{row.label}</p>
                      {countMode === "split" ? (
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Adults</p>
                            <p className={`font-semibold ${row.isYes ? "text-2xl text-[var(--accent)]" : "text-lg"}`}>{row.adults}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Kids</p>
                            <p className={`font-semibold ${row.isYes ? "text-2xl text-[var(--accent)]" : "text-lg"}`}>{row.kids}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Total</p>
                            <p className={`font-semibold ${row.isYes ? "text-3xl text-[var(--accent)]" : "text-xl"}`}>{row.total}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Total</p>
                          <p className={`font-semibold ${row.isYes ? "text-3xl text-[var(--accent)]" : "text-xl"}`}>{row.total}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.1em]">
              Add a guest group
            </h2>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              {guestGroups.length} groups
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {openRsvpToken ? (
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs text-[var(--foreground)] transition"
                  type="button"
                  onClick={async () => {
                    if (!openRsvpToken) return;
                    const ok = await copyToClipboard(
                      `${window.location.origin}/i/open/${openRsvpToken}`
                    );
                    setOpenCopyState(ok ? "copied" : "error");
                    setTimeout(() => setOpenCopyState("idle"), 1500);
                  }}
                >
                  Copy open invitation link
                </button>
                <span
                  className={`w-16 text-[10px] uppercase tracking-[0.2em] transition ${
                    openCopyState === "copied"
                      ? "text-emerald-300 opacity-100"
                      : openCopyState === "error"
                        ? "text-rose-300 opacity-100"
                        : "opacity-0"
                  }`}
                >
                  {openCopyState === "error" ? "Failed" : "Copied"}
                </span>
              </div>
            ) : null}
            <button
              className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
              type="button"
              disabled={bulkSendLoading}
              onClick={() => sendAllEmails("invite")}
            >
              {bulkSendLoading ? "Sending..." : "Send all invites"}
            </button>
            <button
              className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
              type="button"
              disabled={bulkSendLoading}
              onClick={() => sendAllEmails("update")}
            >
              {bulkSendLoading ? "Sending..." : "Send update"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
              <button
                type="button"
                role="switch"
                aria-checked={bulkSendIncludeSent}
                className="oi-toggle"
                onClick={() => setBulkSendIncludeSent((prev) => !prev)}
              >
                <span className="oi-toggle-thumb" />
              </button>
              <span>Include previously emailed guests</span>
            </div>
            <span className="text-xs text-[var(--muted)]">
              Updates always send to all guests with email addresses.
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
            {countMode === "split" ? (
              <>
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
                      setGuestForm((prev) => ({
                        ...prev,
                        expectedAdults: event.target.value,
                      }))
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
                      setGuestForm((prev) => ({
                        ...prev,
                        expectedKids: event.target.value,
                      }))
                    }
                  />
                </div>
              </>
            ) : (
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
                    setGuestForm((prev) => ({
                      ...prev,
                      expectedTotal: event.target.value,
                    }))
                  }
                />
              </div>
            )}
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Guest message <span className="normal-case">(id: guest_message)</span>
              </label>
              <textarea
                className="min-h-[88px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                value={guestForm.notes}
                onChange={(event) =>
                  setGuestForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Optional note shown only on this guest's invitation"
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <span className="text-sm text-[var(--muted)]">Allow open count</span>
              <button
                type="button"
                role="switch"
                aria-checked={guestForm.openCount}
                onClick={() =>
                  setGuestForm((prev) => ({ ...prev, openCount: !prev.openCount }))
                }
                className="oi-toggle"
              >
                <span className="oi-toggle-thumb" />
              </button>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[var(--foreground)]">
                      {group.displayName}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {group.email ?? "No email"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <button
                      className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs text-[var(--foreground)] transition"
                      type="button"
                      onClick={async () => {
                        const ok = await copyToClipboard(
                          `${window.location.origin}/i/${group.token}`
                        );
                        setGuestCopyState((prev) => ({
                          ...prev,
                          [group.id]: ok ? "copied" : "error",
                        }));
                        setTimeout(
                          () =>
                            setGuestCopyState((prev) => ({
                              ...prev,
                              [group.id]: "idle",
                            })),
                          1500
                        );
                      }}
                    >
                      Copy link
                    </button>
                    <button
                      className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
                      type="button"
                      onClick={() => startEdit(group)}
                    >
                      Edit
                    </button>
                    <div className="relative" data-guest-actions-root="true">
                      <button
                        type="button"
                        className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
                        onClick={() =>
                          setActionMenuOpenId((prev) => (prev === group.id ? null : group.id))
                        }
                      >
                        Actions
                      </button>
                      {actionMenuOpenId === group.id ? (
                        <div className="absolute right-0 z-20 mt-2 grid min-w-[170px] gap-1 rounded-xl border border-white/15 bg-[#111125] p-2 text-xs shadow-xl">
                          <a
                            className="rounded-lg px-3 py-2 text-left text-[var(--foreground)] hover:bg-white/10"
                            href={`/i/${group.token}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActionMenuOpenId(null)}
                          >
                            Open link
                          </a>
                        <button
                          className="rounded-lg px-3 py-2 text-left text-[var(--foreground)] hover:bg-white/10"
                          type="button"
                          onClick={() => {
                            startEdit(group);
                            setActionMenuOpenId(null);
                          }}
                        >
                          Edit details
                        </button>
                        <button
                          className="rounded-lg px-3 py-2 text-left text-[var(--foreground)] hover:bg-white/10 disabled:opacity-50"
                          type="button"
                          disabled={!group.email || emailSendState[group.id] === "sending"}
                          onClick={() => {
                            void sendGuestEmail(group, "invite");
                            setActionMenuOpenId(null);
                          }}
                        >
                          Send invite
                        </button>
                        <button
                          className="rounded-lg px-3 py-2 text-left text-[var(--foreground)] hover:bg-white/10 disabled:opacity-50"
                          type="button"
                          disabled={!group.email || emailSendState[group.id] === "sending"}
                          onClick={() => {
                            void sendGuestEmail(group, "update");
                            setActionMenuOpenId(null);
                          }}
                        >
                          Send update
                        </button>
                        <button
                          className="rounded-lg px-3 py-2 text-left text-rose-300 hover:bg-rose-500/20"
                          type="button"
                          onClick={() => {
                            void deleteGuest(group.id, group.displayName);
                            setActionMenuOpenId(null);
                          }}
                        >
                          Delete guest
                        </button>
                      </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {(guestCopyState[group.id] ?? "idle") !== "idle" ||
                (emailSendState[group.id] ?? "idle") !== "idle" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em]">
                    {(guestCopyState[group.id] ?? "idle") !== "idle" ? (
                      <span
                        className={`transition ${
                          (guestCopyState[group.id] ?? "idle") === "copied"
                            ? "text-emerald-300"
                            : "text-rose-300"
                        }`}
                      >
                        {(guestCopyState[group.id] ?? "idle") === "copied"
                          ? "Link copied"
                          : "Copy failed"}
                      </span>
                    ) : null}
                    {(emailSendState[group.id] ?? "idle") !== "idle" ? (
                      <span
                        className={`transition ${
                          (emailSendState[group.id] ?? "idle") === "sent"
                            ? "text-emerald-300"
                            : (emailSendState[group.id] ?? "idle") === "error"
                              ? "text-rose-300"
                              : "text-[var(--muted)]"
                        }`}
                      >
                        {(emailSendState[group.id] ?? "idle") === "sent"
                          ? "Email sent"
                          : (emailSendState[group.id] ?? "idle") === "error"
                            ? "Email failed"
                            : "Sending..."}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-3">
                  {countMode === "split" ? (
                    <>
                      <span>Adults: {group.expectedAdults}</span>
                      <span>Kids: {group.expectedKids}</span>
                      <span>Total: {group.expectedTotal}</span>
                    </>
                  ) : (
                    <span>Total: {group.expectedTotal}</span>
                  )}
                  <span>
                    Email status: {group.inviteEmailSentAt ? "Sent" : "Not sent"}
                    {group.inviteEmailLastType ? ` (${group.inviteEmailLastType})` : ""}
                    {group.inviteEmailSentAt
                      ? ` at ${new Date(group.inviteEmailSentAt).toLocaleString()}`
                      : ""}
                  </span>
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">
                  {group.response ? (
                    countMode === "split" ? (
                      <span>
                        Response: {group.response.optionKey} · Adults: {group.response.adults} · Kids: {group.response.kids} · Total: {group.response.total}
                      </span>
                    ) : (
                      <span>
                        Response: {group.response.optionKey} · Total: {group.response.total}
                      </span>
                    )
                  ) : (
                    <span>Response: Not received</span>
                  )}
                </div>
                {group.response?.message ? (
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    <span>Message: {group.response.message}</span>
                  </div>
                ) : null}
                {group.notes ? (
                  <div className="mt-2 text-xs text-[var(--muted)]">
                    <span>Guest note: {group.notes}</span>
                  </div>
                ) : null}

                {editingId === group.id ? (
                  <div className="mt-4 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Name
                        </label>
                        <input
                          className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={editForm.displayName}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, displayName: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Email
                        </label>
                        <input
                          className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={editForm.email}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Phone
                        </label>
                        <input
                          className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                          value={editForm.phone}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, phone: event.target.value }))
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Guest message <span className="normal-case">(id: guest_message)</span>
                        </label>
                        <textarea
                          className="min-h-[88px] rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                          value={editForm.notes}
                          onChange={(event) =>
                            setEditForm((prev) => ({ ...prev, notes: event.target.value }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {countMode === "split" ? (
                        <>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                              Adults
                            </label>
                            <input
                              className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                              type="number"
                              min="0"
                              value={editForm.expectedAdults}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  expectedAdults: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                              Kids
                            </label>
                            <input
                              className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                              type="number"
                              min="0"
                              value={editForm.expectedKids}
                              onChange={(event) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  expectedKids: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            Total
                          </label>
                          <input
                            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                            type="number"
                            min="0"
                            value={editForm.expectedTotal}
                            onChange={(event) =>
                              setEditForm((prev) => ({
                                ...prev,
                                expectedTotal: event.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                      <span className="text-sm text-[var(--muted)]">Allow open count</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editForm.openCount}
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, openCount: !prev.openCount }))
                        }
                        className="oi-toggle"
                      >
                        <span className="oi-toggle-thumb" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black"
                        type="button"
                        onClick={() => saveEdit(group.id)}
                      >
                        Save guest
                      </button>
                      <button
                        className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-xs"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Record response
                      </p>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            Response
                          </label>
                          <select
                            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                            value={responseForm.optionKey}
                            onChange={(event) =>
                              setResponseForm((prev) => ({
                                ...prev,
                                optionKey: event.target.value,
                              }))
                            }
                          >
                            <option value="">Select</option>
                            {rsvpOptions.map((option) => (
                              <option key={option.key} value={option.key}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            Message
                          </label>
                          <input
                            className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                            value={responseForm.message}
                            onChange={(event) =>
                              setResponseForm((prev) => ({
                                ...prev,
                                message: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        {countMode === "split" ? (
                          <>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                Adults
                              </label>
                              <input
                                className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                                type="number"
                                min="0"
                                value={responseForm.adults}
                                onChange={(event) =>
                                  setResponseForm((prev) => ({
                                    ...prev,
                                    adults: event.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                Kids
                              </label>
                              <input
                                className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                                type="number"
                                min="0"
                                value={responseForm.kids}
                                onChange={(event) =>
                                  setResponseForm((prev) => ({
                                    ...prev,
                                    kids: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                              Total
                            </label>
                            <input
                              className="h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm outline-none focus:border-[var(--accent)]"
                              type="number"
                              min="0"
                              value={responseForm.total}
                              onChange={(event) =>
                                setResponseForm((prev) => ({
                                  ...prev,
                                  total: event.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black"
                          type="button"
                          onClick={() => saveResponse(group.id)}
                        >
                          Save response
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <h2 className="font-[var(--font-display)] text-3xl tracking-[0.08em]">
            Guest chat
          </h2>
          <div className="mt-4 grid max-h-[320px] gap-3 overflow-y-auto pr-1">
            {chatMessages.length > 0 ? (
              chatMessages.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-xl border border-white/10 bg-black/10 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {entry.authorName}
                    {entry.authorRole === "host" ? " (Host)" : ""}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{entry.message}</p>
                </article>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No guest messages yet.</p>
            )}
          </div>
          <form onSubmit={submitHostMessage} className="mt-4 grid gap-3">
            <textarea
              className="min-h-[90px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              value={hostChatInput}
              onChange={(event) => setHostChatInput(event.target.value)}
              maxLength={500}
              placeholder="Send a message to guests"
            />
            <button
              type="submit"
              disabled={hostChatSending}
              className="w-fit rounded-full border border-[var(--accent)] bg-[var(--accent)]/20 px-5 py-2 text-sm font-semibold text-[var(--accent)]"
            >
              {hostChatSending ? "Sending..." : "Send message"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
