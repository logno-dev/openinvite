"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      setMessage("Invalid reset link.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to reset password.");
      setSaving(false);
      return;
    }

    router.push("/auth");
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Account recovery
          </p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[0.12em]">
            Choose a new password
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
        >
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            New password
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Confirm password
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black"
          >
            {saving ? "Saving..." : "Reset password"}
          </button>
          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
          <Link className="text-sm text-[var(--accent)]" href="/auth">
            Back to sign in
          </Link>
        </form>
      </main>
    </div>
  );
}
