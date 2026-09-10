import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Invitation safety | OpenInvite",
  description: "How to recognize suspicious invitations, check links and QR codes, and protect your information when responding to an event.",
};

export default function InvitationSafetyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-white/10">
        <nav aria-label="Public navigation" className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-sm font-semibold tracking-[0.12em]">OpenInvite</Link>
          <Link href="/docs" className="text-sm text-[var(--muted)] underline underline-offset-4">Help &amp; documentation</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <article className="grid gap-9 text-base leading-7 text-[var(--muted)] [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-7 [&_h2]:text-[var(--foreground)] [&_strong]:font-semibold [&_strong]:text-[var(--foreground)]">
          <header className="grid gap-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent)]">A note for invitation recipients</p>
            <h1 className="font-[var(--font-display)] text-4xl leading-tight tracking-[0.04em] text-[var(--foreground)] sm:text-5xl">Enjoy the invitation. Stay aware.</h1>
            <p>
              OpenInvite helps people create and share event invitations. Invitations
              are created by users, and their names, event details, and linked services
              are not verified simply because they appear on OpenInvite.
            </p>
          </header>

          <aside aria-label="Key safety advice" className="rounded-2xl border border-white/15 bg-white/5 p-5 text-[var(--foreground)]">
            If an invitation asks you to send money, share sensitive information, or
            act urgently, pause and confirm the request with the organizer through
            a contact method you already trust.
          </aside>

          <section>
            <h2>Check who actually invited you</h2>
            <p>
              A familiar name, attractive design, or OpenInvite web address is not
              proof of the sender&apos;s identity. Someone could impersonate a friend,
              organization, or event. If the invitation is unexpected, contact the
              person using a phone number or conversation you already know, rather
              than contact details supplied only in the invitation.
            </p>
          </section>

          <section>
            <h2>Look closely at links and QR codes</h2>
            <p>
              Hosts can include maps, registries, and links in their notes. Images
              can also contain QR codes or written web addresses. These may lead
              away from OpenInvite to sites operated by someone else.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Check the full destination address before signing in or entering information. Watch for misspelled or look-alike domains.</li>
              <li>A QR code is just another way to open a link. Review the address your camera displays before opening it.</li>
              <li>A padlock or HTTPS connection does not establish that a site, event, or payment request is legitimate.</li>
            </ul>
          </section>

          <section>
            <h2>Keep payments and sensitive information separate</h2>
            <p>
              <strong>The OpenInvite RSVP form does not require card numbers,
              banking credentials, passwords, or one-time security codes.</strong>{" "}
              Do not put these in an RSVP message or guest chat. Share only the
              personal information needed for the event and that you are comfortable
              sharing with its organizer.
            </p>
            <p className="mt-3">
              Treat unexpected deposits, gift-card requests, account-verification
              demands, and urgent instructions as reasons to check directly with
              the host. An invitation can contain a misleading request even when
              the page itself loads normally.
            </p>
          </section>

          <section>
            <h2>Understand what hosting does and does not mean</h2>
            <p>
              OpenInvite restricts template scripts and designer-supplied navigation,
              but those restrictions cannot determine whether an event or message
              is honest. Text, artwork, host-provided links, and QR codes can still
              be misleading. External images and fonts may also contact third-party
              servers when the invitation loads.
            </p>
            <p className="mt-3">
              Hosting an invitation is not an endorsement of its organizer, event,
              registry, or any other linked service. This notice is a general
              reminder shown on invitations, not a finding that a particular host
              has done something wrong.
            </p>
          </section>

          <section>
            <h2>If something seems wrong</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Stop interacting with the invitation and verify it with the person who supposedly sent it.</li>
              <li>If you entered a password on a suspicious site, change it through the service&apos;s official website and review your account security.</li>
              <li>If you sent money or shared payment details, contact your bank or payment provider using its official app, website, or phone number.</li>
              <li>Keep relevant screenshots and the URL if you need to report the incident. Avoid posting private invitation links publicly; they may provide access to a guest&apos;s RSVP.</li>
            </ul>
          </section>

          <footer className="border-t border-white/10 pt-6 text-sm">
            You can close this tab to return to your invitation, or{" "}
            <Link href="/" className="text-[var(--foreground)] underline underline-offset-4">visit OpenInvite</Link>.
          </footer>
        </article>
      </main>
    </div>
  );
}
