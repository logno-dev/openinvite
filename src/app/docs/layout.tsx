import type { ReactNode } from "react";
import DocsSidebar from "@/app/docs/DocsSidebar";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_85%_10%,#1b1238_0%,transparent_55%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute -left-32 top-8 h-72 w-72 rounded-full border border-white/10 bg-[conic-gradient(from_140deg,#ff3d81,#ffbf00,#c7ff1a,#00f0ff,#6d5cff,#ff3d81)] opacity-60 blur-2xl motion-safe:animate-[spinSlow_26s_linear_infinite]" />
      <div className="pointer-events-none absolute right-10 top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff3d81_0%,#6d5cff_35%,transparent_70%)] opacity-70 blur-2xl motion-safe:animate-[float_16s_ease-in-out_infinite]" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-base font-semibold text-black">
            OI
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              Documentation
            </p>
            <p className="font-[var(--font-display)] text-2xl tracking-[0.2em] text-[var(--foreground)]">
              OpenInvite
            </p>
          </div>
        </div>
        <a
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-white/40"
          href="/"
        >
          Back home
        </a>
      </header>

      <main className="relative mx-auto grid w-full max-w-6xl gap-6 px-6 pb-20 pt-10 lg:grid-cols-[260px_1fr]">
        <DocsSidebar />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
