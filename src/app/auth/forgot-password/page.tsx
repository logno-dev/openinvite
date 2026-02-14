"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Unable to send reset email.");
      setLoading(false);
      return;
    }

    setMessage("If an account exists for that email, a reset link was sent.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            Account recovery
          </p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[0.12em]">
            Reset password
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Enter your account email and we will send a reset link.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
        >
          <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Email
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black"
          >
            {loading ? "Sending..." : "Send reset link"}
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
