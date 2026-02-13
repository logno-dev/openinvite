import { cookies } from "next/headers";
import { getSessionUserByToken, SESSION_COOKIE } from "@/lib/session";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? await getSessionUserByToken(token) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_10%_-10%,#2a2b52_0%,transparent_60%),radial-gradient(900px_600px_at_85%_10%,#1b1238_0%,transparent_55%),linear-gradient(180deg,#0a0a14_0%,#120c26_55%,#0a0a14_100%)]">
      <div className="pointer-events-none absolute -left-32 top-8 h-72 w-72 rounded-full border border-white/10 bg-[conic-gradient(from_140deg,#ff3d81,#ffbf00,#c7ff1a,#00f0ff,#6d5cff,#ff3d81)] opacity-60 blur-2xl motion-safe:animate-[spinSlow_26s_linear_infinite]" />
      <div className="pointer-events-none absolute right-10 top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,#ff3d81_0%,#6d5cff_35%,transparent_70%)] opacity-70 blur-2xl motion-safe:animate-[float_16s_ease-in-out_infinite]" />
      <div className="pointer-events-none absolute bottom-16 left-1/2 h-40 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#00f0ff_0%,transparent_70%)] opacity-50 blur-2xl" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-8">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--accent)] text-base font-semibold text-black">
            OI
          </span>
          <span className="font-[var(--font-display)] text-2xl tracking-[0.2em] text-[var(--foreground)]">
            OpenInvite
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          <a className="transition-colors hover:text-[var(--foreground)]" href="#how">
            How it works
          </a>
          <a className="transition-colors hover:text-[var(--foreground)]" href="#hosts">
            Hosts
          </a>
          <a className="transition-colors hover:text-[var(--foreground)]" href="#rsvp">
            RSVP
          </a>
          <a
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-white/40"
            href={user ? "/dashboard" : "/auth"}
          >
            {user ? "Go to dashboard" : "Sign in"}
          </a>
        </nav>
        <a
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-white/40 md:hidden"
          href={user ? "/dashboard" : "/auth"}
        >
          {user ? "Dashboard" : "Sign in"}
        </a>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-[var(--muted)]">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Party-ready
              </span>
              <span>Color-first invites</span>
            </div>
            <h1 className="font-[var(--font-display)] text-4xl leading-[0.95] text-[var(--foreground)] sm:text-5xl lg:text-6xl motion-safe:animate-[reveal_800ms_ease-out]">
              Throw a louder invite.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[var(--muted)] motion-safe:animate-[reveal_900ms_ease-out]">
              Bring your own hosted HTML template. OpenInvite injects invitation
              details, guest-specific data, and the RSVP form into your page,
              while you manage hosts and guests from one dashboard.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-[var(--accent)]/40 transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                href={user ? "/dashboard/invitations/new" : "/auth"}
              >
                Start an invite
              </a>
              <a
                className="rounded-full border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-0.5"
                href={user ? "/dashboard" : "/auth"}
              >
                View dashboard
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-4 hidden h-24 w-24 rounded-2xl bg-[var(--sun)]/20 blur-xl lg:block" />
            <div className="rounded-3xl border border-white/15 bg-[var(--surface)] p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[var(--lime)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black">
                  Saturday Night
                </span>
                <span className="text-xs text-[var(--muted)]">Invite #777</span>
              </div>
              <h2 className="mt-6 font-[var(--font-display)] text-3xl tracking-[0.1em] text-[var(--foreground)] sm:text-4xl">
                Neon Rooftop Jam
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Hosted by Roya + Alex • Aug 23, 2026 • 9:00 PM
              </p>
              <div className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Skyline Terrace
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      44 Harbor Ave, Seattle
                    </p>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-xs text-[var(--muted)]">
                    DJ + lights
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">
                RSVP form and guest fields render inside <span className="font-semibold">#response</span>.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3" id="how">
          {[
            {
              title: "Bring your HTML",
              text: "Point draft and live URLs at any hosted HTML template. We sanitize and inject data.",
            },
            {
              title: "Guest-specific links",
              text: "Each guest group gets a unique URL with their name and counts prefilled.",
            },
            {
              title: "Open RSVP link",
              text: "Share a general link that lets guests add their own details before responding.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-sm"
            >
              <h3 className="font-[var(--font-display)] text-2xl tracking-[0.1em] text-[var(--foreground)]">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {card.text}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-16 grid gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:grid-cols-[1.2fr_0.8fr]" id="hosts">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Built for co-hosts
            </p>
            <h2 className="mt-3 font-[var(--font-display)] text-2xl tracking-[0.12em] text-[var(--foreground)] sm:text-3xl">
              Plan together. Party harder.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Add hosts who can edit invitation details, manage guest lists, and
              publish updates without forwarding group texts.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              "Assign RSVP follow-ups",
              "Share playlist ideas",
              "Pin VIP guests",
              "Track response momentum",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-[var(--foreground)]"
              >
                <span>{item}</span>
                <span className="text-xs text-[var(--muted)]">Live</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
