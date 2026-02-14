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
          {links.map((link) => {
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
            {links.map((link) => {
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
          </div>
        </div>
      ) : null}
    </header>
  );
}
