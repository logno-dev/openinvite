"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function HostInvitePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [message, setMessage] = useState("Accepting invite...");

  useEffect(() => {
    async function accept() {
      if (!token) return;
      const response = await fetch(`/api/host-invites/${token}`, { method: "POST" });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : {};

      if (response.status === 401) {
        router.push(`/auth?next=/host-invite/${token}`);
        return;
      }

      if (!response.ok) {
        setMessage(data.error ?? "Invite failed");
        return;
      }

      router.push(`/dashboard/invitations/${data.invitationId}`);
    }

    accept();
  }, [router, token]);

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_90%_10%,#1b1238_0%,transparent_60%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16 text-center">
        <h1 className="font-[var(--font-display)] text-3xl tracking-[0.12em] sm:text-4xl lg:text-5xl">
          Host invite
        </h1>
        <p className="text-sm text-[var(--muted)]">{message}</p>
      </main>
    </div>
  );
}
