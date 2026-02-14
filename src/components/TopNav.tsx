"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/dashboard/LogoutButton";

type TopNavProps = {
  links: Array<{ label: string; href: string }>;
  homeHref?: string;
  showLogout?: boolean;
};

export default function TopNav({ links, homeHref = "/", showLogout }: TopNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const settingsLink = links.find((link) => link.href === "/settings");
  const navLinks = links.filter((link) => link.href !== "/settings");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a14]/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-3" href={homeHref}>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--accent)] text-sm font-semibold text-black">
            OI
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-[var(--muted)]">
              OpenInvite
            </p>
            <p className="font-[var(--font-display)] text-xl tracking-[0.2em] text-[var(--foreground)]">
              Studio
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-3 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            const isPrimaryAction = link.href === "/dashboard/invitations/new";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isPrimaryAction
                    ? `rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                          : "border-[var(--accent)]/70 bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"
                      }`
                    : `text-xs uppercase tracking-[0.22em] transition ${
                        active
                          ? "text-[var(--foreground)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`
                }
              >
                {link.label}
              </Link>
            );
          })}
          {showLogout ? <LogoutButton /> : null}
          {settingsLink ? (
            <Link
              href={settingsLink.href}
              aria-label="Settings"
              className={`rounded-full border p-2 transition ${
                pathname === settingsLink.href
                  ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "border-white/25 bg-white/5 text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="sr-only">Settings</span>
            </Link>
          ) : null}
        </nav>

        <button
          type="button"
          className="relative h-6 w-6 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <span
            className={`absolute left-0 top-0 h-0.5 w-6 bg-[var(--foreground)] transition ${
              open ? "translate-y-[11px] translate-x-[5px] rotate-45" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[11px] h-0.5 w-6 bg-[var(--foreground)] transition ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute left-0 top-[22px] h-0.5 w-6 bg-[var(--foreground)] transition ${
              open ? "-translate-y-[11px] translate-x-[5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-[#0a0a14]/90 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const isPrimaryAction = link.href === "/dashboard/invitations/new";
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    isPrimaryAction
                      ? `rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                          active
                            ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                            : "border-[var(--accent)]/70 bg-[var(--accent)]/20 text-[var(--accent)]"
                        }`
                      : `text-xs uppercase tracking-[0.22em] ${
                          active
                            ? "text-[var(--foreground)]"
                            : "text-[var(--muted)] hover:text-[var(--foreground)]"
                        }`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            {showLogout ? <LogoutButton /> : null}
            {settingsLink ? (
              <Link
                href={settingsLink.href}
                aria-label="Settings"
                className={`w-fit rounded-full border p-2 ${
                  pathname === settingsLink.href
                    ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "border-white/25 bg-white/5 text-[var(--muted)]"
                }`}
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="sr-only">Settings</span>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </header>
  );
}
