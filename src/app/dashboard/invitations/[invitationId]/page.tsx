"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type InvitationForm = {
  title: string;
  templateUrlDraft: string;
  templateUrlLive: string;
  date: string;
  time: string;
  eventDate: string;
  eventTime: string;
  dateFormat: string;
  timeFormat: string;
  locationName: string;
  address: string;
  mapLink: string;
  mapEmbed: string;
  notes: string;
  timezone: string;
  countMode: "split" | "total";
  rsvpYes: string;
  rsvpNo: string;
  rsvpMaybe: string;
  previewToken?: string | null;
  openRsvpToken?: string | null;
};

type InvitationResponse = {
  invitation: {
    id: string;
    title: string;
    timezone: string;
    templateUrlDraft: string | null;
    templateUrlLive: string | null;
    previewToken: string | null;
    openRsvpToken: string | null;
    countMode: "split" | "total";
  };
  details: {
    date: string | null;
    time: string | null;
    eventDate: string | null;
    eventTime: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    locationName: string | null;
    address: string | null;
    mapLink: string | null;
    mapEmbed: string | null;
    notes: string | null;
  } | null;
  rsvpOptions: Array<{ key: string; label: string }>;
};

export default function EditInvitationPage() {
  const params = useParams();
  const invitationId = typeof params.invitationId === "string" ? params.invitationId : "";
  const [form, setForm] = useState<InvitationForm | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [hostInviteLink, setHostInviteLink] = useState<string | null>(null);
  const [hostInviteCopyState, setHostInviteCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");

  useEffect(() => {
    async function load() {
      if (!invitationId) return;
      const response = await fetch(`/api/invitations/${invitationId}`);
      const contentType = response.headers.get("content-type") ?? "";
      let data: InvitationResponse | { error?: string } = { error: "Failed to load" };

      if (contentType.includes("application/json")) {
        data = (await response.json()) as InvitationResponse;
      }

      if (!response.ok || !("invitation" in data) || !("rsvpOptions" in data)) {
        setMessage((data as { error?: string }).error ?? "Failed to load");
        return;
      }

      const rsvpYes = data.rsvpOptions.find((opt) => opt.key === "yes")?.label ?? "";
      const rsvpNo = data.rsvpOptions.find((opt) => opt.key === "no")?.label ?? "";
      const rsvpMaybe =
        data.rsvpOptions.find((opt) => opt.key === "maybe")?.label ?? "";

      setForm({
        title: data.invitation.title,
        templateUrlDraft: data.invitation.templateUrlDraft ?? "",
        templateUrlLive: data.invitation.templateUrlLive ?? "",
        date: data.details?.date ?? "",
        time: data.details?.time ?? "",
        eventDate: data.details?.eventDate ?? "",
        eventTime: data.details?.eventTime ?? "",
        dateFormat: data.details?.dateFormat ?? "MMM d, yyyy",
        timeFormat: data.details?.timeFormat ?? "h:mm a",
        locationName: data.details?.locationName ?? "",
        address: data.details?.address ?? "",
        mapLink: data.details?.mapLink ?? "",
        mapEmbed: data.details?.mapEmbed ?? "",
        notes: data.details?.notes ?? "",
        timezone: data.invitation.timezone,
        countMode: data.invitation.countMode,
        rsvpYes,
        rsvpNo,
        rsvpMaybe,
        previewToken: data.invitation.previewToken,
        openRsvpToken: data.invitation.openRsvpToken,
      });

    }

    load();
  }, [invitationId]);

  function updateField<K extends keyof InvitationForm>(key: K, value: InvitationForm[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/invitations/${invitationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        templateUrlDraft: form.templateUrlDraft,
        templateUrlLive: form.templateUrlLive,
        date: form.date,
        time: form.time,
        eventDate: form.eventDate,
        eventTime: form.eventTime,
        dateFormat: form.dateFormat,
        timeFormat: form.timeFormat,
        locationName: form.locationName,
        address: form.address,
        mapLink: form.mapLink,
        mapEmbed: form.mapEmbed,
        notes: form.notes,
        timezone: form.timezone,
        countMode: form.countMode,
        rsvpOptions: [
          { key: "yes", label: form.rsvpYes },
          { key: "no", label: form.rsvpNo },
          { key: "maybe", label: form.rsvpMaybe },
        ],
      }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    let data: { error?: string } = {};
    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      setMessage(data.error ?? "Failed to update invitation");
      setSaving(false);
      return;
    }

    setMessage("Invitation updated.");
    setSaving(false);
  }

  async function handleCreateHostInvite() {
    const response = await fetch(
      `/api/invitations/${invitationId}/host-invites`,
      { method: "POST" }
    );
    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await response.json() : {};
    if (!response.ok) {
      setMessage(data.error ?? "Failed to create invite");
      return;
    }
    const link = `${window.location.origin}/host-invite/${data.token}`;
    setHostInviteLink(link);
    setHostInviteCopyState("idle");
  }

  async function copyHostInvite() {
    if (!hostInviteLink) return;
    try {
      await navigator.clipboard.writeText(hostInviteLink);
      setHostInviteCopyState("copied");
      setTimeout(() => setHostInviteCopyState("idle"), 1500);
    } catch {
      setHostInviteCopyState("error");
      setTimeout(() => setHostInviteCopyState("idle"), 1500);
    }
  }


  if (!form) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
          <p className="text-sm text-[var(--muted)]">Loading invitation...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Edit invitation
          </p>
          <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
            {form.title}
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Template labels include the div id in parentheses.
          </p>
        </div>
        <a
          className="self-start rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
          href="/dashboard"
        >
          Back to dashboard
        </a>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Title <span className="normal-case">(id: title)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Draft template URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.templateUrlDraft}
                onChange={(event) => updateField("templateUrlDraft", event.target.value)}
                placeholder="https://example.com/invite.html"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Live template URL
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.templateUrlLive}
                onChange={(event) => updateField("templateUrlLive", event.target.value)}
                placeholder="https://cdn.example.com/invite.html"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Event date <span className="normal-case">(id: date)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                type="date"
                value={form.eventDate}
                onChange={(event) => updateField("eventDate", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Event time <span className="normal-case">(id: time)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                type="time"
                value={form.eventTime}
                onChange={(event) => updateField("eventTime", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Date format
              </label>
              <select
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.dateFormat}
                onChange={(event) => updateField("dateFormat", event.target.value)}
              >
                <option value="MMM d, yyyy">Feb 18, 2026</option>
                <option value="MMMM d, yyyy">February 18, 2026</option>
                <option value="EEE, MMM d">Wed, Feb 18</option>
                <option value="yyyy-MM-dd">2026-02-18</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Time format
              </label>
              <select
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.timeFormat}
                onChange={(event) => updateField("timeFormat", event.target.value)}
              >
                <option value="h:mm a">6:00 PM</option>
                <option value="h a">6 PM</option>
                <option value="HH:mm">18:00</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Location <span className="normal-case">(id: location)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.locationName}
                onChange={(event) => updateField("locationName", event.target.value)}
                placeholder="Skyline Terrace"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Address <span className="normal-case">(id: address)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder="44 Harbor Ave, Seattle"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Map link <span className="normal-case">(id: map_link)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.mapLink}
                onChange={(event) => updateField("mapLink", event.target.value)}
                placeholder="https://maps.example.com"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Map embed code <span className="normal-case">(id: map_link)</span>
              </label>
              <textarea
                className="min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                value={form.mapEmbed}
                onChange={(event) => updateField("mapEmbed", event.target.value)}
                placeholder="<iframe src=...></iframe>"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Notes <span className="normal-case">(id: notes)</span>
              </label>
              <textarea
                className="min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="Dress code, parking, or any special notes."
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                RSVP yes label <span className="normal-case">(id: rsvp_yes_label)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.rsvpYes}
                onChange={(event) => updateField("rsvpYes", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                RSVP no label <span className="normal-case">(id: rsvp_no_label)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.rsvpNo}
                onChange={(event) => updateField("rsvpNo", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                RSVP maybe label <span className="normal-case">(id: rsvp_maybe_label)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.rsvpMaybe}
                onChange={(event) => updateField("rsvpMaybe", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Timezone
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.timezone}
                onChange={(event) => updateField("timezone", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Count mode
              </label>
              <select
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.countMode}
                onChange={(event) =>
                  updateField("countMode", event.target.value as "split" | "total")
                }
              >
                <option value="split">Adults + Kids</option>
                <option value="total">Total guests only</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <a
              className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              href={`/dashboard/invitations/${invitationId}/guests`}
            >
              Manage guests
            </a>
            {form.previewToken && form.templateUrlDraft ? (
              <a
                className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                href={`/preview/${form.previewToken}?mode=guest`}
                target="_blank"
                rel="noreferrer"
              >
                Open preview
              </a>
            ) : null}
            <button
              className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              type="button"
              onClick={handleCreateHostInvite}
            >
              Create host invite link
            </button>
            {form.openRsvpToken ? (
              <span className="text-xs text-[var(--muted)]">
                Open RSVP: /i/open/{form.openRsvpToken}
              </span>
            ) : null}
            {message ? <span className="text-sm text-[var(--muted)]">{message}</span> : null}
          </div>
          {hostInviteLink ? (
            <button
              className={`flex w-full flex-wrap items-center gap-2 rounded-2xl border p-4 text-left text-sm transition ${
                hostInviteCopyState === "copied"
                  ? "border-emerald-300 bg-emerald-200 text-emerald-900"
                  : hostInviteCopyState === "error"
                    ? "border-rose-300 bg-rose-200 text-rose-900"
                    : "border-white/15 bg-white/5 text-[var(--foreground)]"
              }`}
              type="button"
              onClick={copyHostInvite}
            >
              <span className="max-w-full break-all">{hostInviteLink}</span>
              <span className="text-[10px] uppercase tracking-[0.2em]">
                {hostInviteCopyState === "copied"
                  ? "Copied"
                  : hostInviteCopyState === "error"
                    ? "Copy failed"
                    : "Click to copy"}
              </span>
            </button>
          ) : null}
        </form>
      </main>
    </div>
  );
}
