"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsNav } from "@/app/docs/nav";

export default function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 lg:min-h-0 lg:overflow-y-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Docs</p>
        <h2 className="mt-2 font-[var(--font-display)] text-lg tracking-[0.2em] text-[var(--foreground)]">
          OpenInvite
        </h2>
      </div>
      <nav className="flex flex-col gap-6 text-sm">
        {docsNav.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
              {section.title}
            </span>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-xl px-3 py-2 transition ${
                      isActive
                        ? "border border-white/20 bg-white/10 text-[var(--foreground)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
