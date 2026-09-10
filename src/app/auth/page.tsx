"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { safeRedirectPath } from "@/lib/navigation";

type FormState = {
  email: string;
  password: string;
  displayName?: string;
};

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const claimGuestToken = searchParams.get("claimGuestToken") || "";
  const nextPath = safeRedirectPath(
    searchParams.get("next"),
    claimGuestToken ? "/my-invitations" : "/dashboard"
  );
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
  const [mode, setMode] = useState<"register" | "login">("login");
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";
  const formState = isRegister ? registerState : loginState;
  const setFormState = isRegister ? setRegisterState : setLoginState;
  const message = isRegister ? registerMessage : loginMessage;

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setLoading("register");
    setRegisterMessage("");

    try {
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
      setRegisterMessage(data.error || "Unable to create account");
    } catch {
      setRegisterMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading("login");
    setLoginMessage("");

    try {
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
      setLoginMessage(data.error || "Unable to sign in");
    } catch {
      setLoginMessage("Unable to connect. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
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

        <div className="grid gap-6">
          <div
            role="group"
            aria-label="Account access"
            className="grid grid-cols-2 gap-2 rounded-full border border-white/15 bg-white/5 p-1.5"
          >
            {(["login", "register"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                aria-controls="auth-form"
                disabled={loading !== null}
                onClick={() => {
                  setMode(option);
                  setShowPassword(false);
                }}
                className={`rounded-full px-3 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-wait ${
                  mode === option
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--muted)] hover:bg-white/10 hover:text-[var(--foreground)]"
                }`}
              >
                {option === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
          <form
            key={mode}
            id="auth-form"
            aria-labelledby="auth-heading"
            onSubmit={isRegister ? handleRegister : handleLogin}
            className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-white/5 p-6"
          >
            <h2 id="auth-heading" className="font-[var(--font-display)] text-3xl tracking-[0.08em]">
              {isRegister ? "Create account" : "Sign in"}
            </h2>
            {isRegister ? (
              <>
                <label htmlFor="auth-name" className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Display name
                </label>
                <input
                  id="auth-name"
                  name="displayName"
                  autoComplete="name"
                  className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
                  value={registerState.displayName}
                  onChange={(event) =>
                    setRegisterState((prev) => ({ ...prev, displayName: event.target.value }))
                  }
                  placeholder="Riley Thompson"
                />
              </>
            ) : null}
            <label htmlFor="auth-email" className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Email
            </label>
            <input
              id="auth-email"
              name="email"
              autoComplete="username"
              className="h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm outline-none focus:border-[var(--accent)]"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
              placeholder="you@openinvite.com"
              required
            />
            <label htmlFor="auth-password" className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-4 pr-14 text-sm outline-none focus:border-[var(--accent)]"
                type={showPassword ? "text" : "password"}
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={isRegister ? "At least 8 characters" : "Your password"}
                minLength={isRegister ? 8 : undefined}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-controls="auth-password"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[var(--muted)] transition hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                <svg
                  aria-hidden="true"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword ? <path d="m3 3 18 18" /> : null}
                </svg>
              </button>
            </div>
            <button
              type="submit"
              className="mt-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
              disabled={loading !== null}
            >
              {loading !== null
                ? isRegister ? "Creating..." : "Signing in..."
                : isRegister ? "Create account" : "Sign in"}
            </button>
            {!isRegister ? (
              <Link className="text-sm text-[var(--accent)]" href="/auth/forgot-password">
                Forgot password?
              </Link>
            ) : null}
            {message ? (
              <p role="status" className="text-sm text-[var(--muted)]">{message}</p>
            ) : null}
          </form>
        </div>
      </main>
    </div>
  );
}
