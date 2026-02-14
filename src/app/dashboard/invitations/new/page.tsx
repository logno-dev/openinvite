"use client";

import { useState } from "react";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

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
  notes2: string;
  notes3: string;
  timezone: string;
  countMode: "split" | "total";
  rsvpYes: string;
  rsvpNo: string;
  rsvpMaybe: string;
};

export default function NewInvitationPage() {
  const [form, setForm] = useState<InvitationForm>({
    title: "",
    templateUrlDraft: "",
    templateUrlLive: "",
    date: "",
    time: "",
    eventDate: "",
    eventTime: "",
    dateFormat: "MMM d, yyyy",
    timeFormat: "h:mm a",
    locationName: "",
    address: "",
    mapLink: "",
    mapEmbed: "",
    notes: "",
    notes2: "",
    notes3: "",
    timezone: "UTC",
    countMode: "split",
    rsvpYes: "We will be there",
    rsvpNo: "No thank you",
    rsvpMaybe: "Maybe",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [openRsvpToken, setOpenRsvpToken] = useState<string | null>(null);

  function updateField<K extends keyof InvitationForm>(key: K, value: InvitationForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/invitations", {
      method: "POST",
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
        notes2: form.notes2,
        notes3: form.notes3,
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
    let data: { previewToken?: string | null; openRsvpToken?: string | null; error?: string } = {};

    if (contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      setMessage(data.error ?? "Failed to create invitation");
      setSaving(false);
      return;
    }

    setPreviewToken(data.previewToken ?? null);
    setOpenRsvpToken(data.openRsvpToken ?? null);
    setMessage("Invitation created.");
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            New invitation
          </p>
          <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
            Build the card data
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Each label shows the template div id in parentheses.
          </p>
        </div>

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
                onChange={(event) =>
                  updateField("templateUrlDraft", event.target.value)
                }
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
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Notes section 2 <span className="normal-case">(id: notes_2)</span>
              </label>
              <textarea
                className="min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                value={form.notes2}
                onChange={(event) => updateField("notes2", event.target.value)}
                placeholder="Additional details or helpful info."
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Notes section 3 <span className="normal-case">(id: notes_3)</span>
              </label>
              <textarea
                className="min-h-[120px] rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                value={form.notes3}
                onChange={(event) => updateField("notes3", event.target.value)}
                placeholder="Last call, reminders, or footer copy."
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
              {saving ? "Saving..." : "Create invitation"}
            </button>
            {previewToken && (form.templateUrlDraft || form.templateUrlLive) ? (
              <a
                className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                href={`/preview-client/${previewToken}?mode=guest`}
                target="_blank"
                rel="noreferrer"
              >
                Open preview
              </a>
            ) : null}
            {openRsvpToken ? (
              <span className="text-xs text-[var(--muted)]">
                Open RSVP: /i/open/{openRsvpToken}
              </span>
            ) : null}
            {message ? <span className="text-sm text-[var(--muted)]">{message}</span> : null}
          </div>
        </form>
      </main>
    </div>
  );
}
