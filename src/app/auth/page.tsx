"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FormState = {
  email: string;
  password: string;
  displayName?: string;
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimGuestToken = searchParams.get("claimGuestToken") || "";
  const nextPath =
    searchParams.get("next") || (claimGuestToken ? "/my-invitations" : "/dashboard");
  const [registerState, setRegisterState] = useState<FormState>({
    email: "",
    password: "",
    displayName: "",
  });
  const [loginState, setLoginState] = useState<FormState>({
    email: "",
    password: "",
  });
  const [registerMessage, setRegisterMessage] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [loading, setLoading] = useState<"register" | "login" | null>(null);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setLoading("register");
    setRegisterMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...registerState, claimGuestToken }),
    });

    const data = await response.json();
    if (response.ok) {
      router.push(nextPath);
      return;
    }
    setRegisterMessage(data.error);
    setLoading(null);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading("login");
    setLoginMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...loginState, claimGuestToken }),
    });

    const data = await response.json();
    if (response.ok) {
      router.push(nextPath);
      return;
    }
    setLoginMessage(data.error);
    setLoading(null);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <div className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
            OpenInvite access
          </p>
          <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
            Start the party.
          </h1>
          <p className="max-w-xl text-base text-[var(--muted)]">
            {claimGuestToken
              ? "Sign in or create an account to manage this invitation and any future invites sent to you."
              : "Create an account to launch a new invite or sign in to manage existing guest lists."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <form
            onSubmit={handleRegister}
            className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
          >
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.08em]">
              Create account
            </h2>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Display name
            </label>
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              value={registerState.displayName}
              onChange={(event) =>
                setRegisterState((prev) => ({
                  ...prev,
                  displayName: event.target.value,
                }))
              }
              placeholder="Riley Thompson"
            />
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Email
            </label>
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="email"
              value={registerState.email}
              onChange={(event) =>
                setRegisterState((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="you@openinvite.com"
              required
            />
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Password
            </label>
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="password"
              value={registerState.password}
              onChange={(event) =>
                setRegisterState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              placeholder="At least 8 characters"
              required
            />
            <button
              type="submit"
              className="mt-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5"
              disabled={loading === "register"}
            >
              {loading === "register" ? "Creating..." : "Create account"}
            </button>
            {registerMessage ? (
              <p className="text-sm text-[var(--muted)]">{registerMessage}</p>
            ) : null}
          </form>

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
          >
            <h2 className="font-[var(--font-display)] text-3xl tracking-[0.08em]">
              Sign in
            </h2>
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Email
            </label>
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="email"
              value={loginState.email}
              onChange={(event) =>
                setLoginState((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="you@openinvite.com"
              required
            />
            <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Password
            </label>
            <input
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="password"
              value={loginState.password}
              onChange={(event) =>
                setLoginState((prev) => ({
                  ...prev,
                  password: event.target.value,
                }))
              }
              placeholder="Your password"
              required
            />
            <button
              type="submit"
              className="mt-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
              disabled={loading === "login"}
            >
              {loading === "login" ? "Signing in..." : "Sign in"}
            </button>
            {loginMessage ? (
              <p className="text-sm text-[var(--muted)]">{loginMessage}</p>
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}
