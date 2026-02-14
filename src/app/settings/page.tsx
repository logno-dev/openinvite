"use client";

import { useEffect, useState } from "react";
import TopNav from "@/components/TopNav";
import { dashboardNavLinks } from "@/lib/nav-links";

type AccountSettings = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  shareEmailWithGuests: boolean;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [shareEmailWithGuests, setShareEmailWithGuests] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/account/settings");
      if (response.status === 401) {
        window.location.href = "/auth?next=/settings";
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        setMessage("Failed to load settings");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Failed to load settings");
        return;
      }

      const next = data.settings as AccountSettings;
      setSettings(next);
      setDisplayName(next.displayName ?? "");
      setPhone(next.phone ?? "");
      setShareEmailWithGuests(next.shareEmailWithGuests);
    }

    load();
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/account/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        phone,
        shareEmailWithGuests,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Failed to save settings");
      setSaving(false);
      return;
    }

    setMessage("Settings updated.");
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <TopNav links={dashboardNavLinks} homeHref="/dashboard" showLogout />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">Account</p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[0.12em] sm:text-5xl">
            Settings
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Manage your profile details and guest privacy preferences.
          </p>
        </header>

        {!settings ? (
          <p className="text-sm text-[var(--muted)]">Loading settings...</p>
        ) : (
          <form
            onSubmit={handleSave}
            className="grid gap-5 rounded-3xl border border-white/15 bg-white/5 p-6"
          >
            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Email
              </label>
              <input
                className="h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-[var(--muted)]"
                value={settings.email}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Display name
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="How your name appears"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Phone
              </label>
              <input
                className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Optional contact number"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm text-[var(--foreground)]">Share email with other guests</p>
                <p className="text-xs text-[var(--muted)]">
                  When enabled, your email can appear in shared guest lists.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={shareEmailWithGuests}
                className="oi-toggle"
                onClick={() => setShareEmailWithGuests((prev) => !prev)}
              >
                <span className="oi-toggle-thumb" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black"
              >
                {saving ? "Saving..." : "Save settings"}
              </button>
              {message ? <span className="text-sm text-[var(--muted)]">{message}</span> : null}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
