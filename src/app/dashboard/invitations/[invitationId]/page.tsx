"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type InvitationForm = {
  title: string;
  templateUrlDraft: string;
  templateUrlLive: string;
  date: string;
  time: string;
  locationName: string;
  address: string;
  mapLink: string;
  notes: string;
  timezone: string;
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
  };
  details: {
    date: string | null;
    time: string | null;
    locationName: string | null;
    address: string | null;
    mapLink: string | null;
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

  useEffect(() => {
    async function load() {
      if (!invitationId) return;
      const response = await fetch(`/api/invitations/${invitationId}`);
      const contentType = response.headers.get("content-type") ?? "";
      let data: InvitationResponse | { error?: string } = { error: "Failed to load" };

      if (contentType.includes("application/json")) {
        data = (await response.json()) as InvitationResponse;
      }

      if (!response.ok) {
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
        locationName: data.details?.locationName ?? "",
        address: data.details?.address ?? "",
        mapLink: data.details?.mapLink ?? "",
        notes: data.details?.notes ?? "",
        timezone: data.invitation.timezone,
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
        locationName: form.locationName,
        address: form.address,
        mapLink: form.mapLink,
        notes: form.notes,
        timezone: form.timezone,
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
          <h1 className="font-[var(--font-display)] text-5xl tracking-[0.12em]">
            {form.title}
          </h1>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Template labels include the div id in parentheses.
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
                Date <span className="normal-case">(id: date)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.date}
                onChange={(event) => updateField("date", event.target.value)}
                placeholder="Sep 14, 2026"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Time <span className="normal-case">(id: time)</span>
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                placeholder="5:30 PM"
              />
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
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {form.previewToken && form.templateUrlDraft ? (
              <a
                className="rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
                href={`/preview/${form.previewToken}`}
                target="_blank"
                rel="noreferrer"
              >
                Open preview
              </a>
            ) : null}
            {form.openRsvpToken ? (
              <span className="text-xs text-[var(--muted)]">
                Open RSVP: /i/open/{form.openRsvpToken}
              </span>
            ) : null}
            {message ? <span className="text-sm text-[var(--muted)]">{message}</span> : null}
          </div>
        </form>
      </main>
    </div>
  );
}
