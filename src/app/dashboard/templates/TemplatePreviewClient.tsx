"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { applyPreviewDataToHtml, type PreviewPayload } from "@/lib/preview-template";

type TemplatePreviewClientProps = {
  templateUrl: string | null;
};

export default function TemplatePreviewClient({ templateUrl }: TemplatePreviewClientProps) {
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") ?? "open") === "guest" ? "guest" : "open";
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const payload = useMemo<PreviewPayload>(
    () => ({
      invitation: {
        id: "template-preview",
        title: "Template Preview",
        templateUrlDraft: templateUrl,
        templateUrlLive: null,
        openRsvpToken: "template-preview",
        timezone: "UTC",
        countMode: "split",
      },
      details: {
        date: "2026-06-21",
        time: "18:00",
        eventDate: "2026-06-21",
        eventTime: "18:00",
        dateFormat: "MMM d, yyyy",
        timeFormat: "h:mm a",
        locationName: "Rooftop Conservatory",
        address: "44 Harbor Ave, Seattle",
        mapLink: "https://maps.google.com",
        registryLink: "https://registry.example.com/lena-marco",
        mapEmbed: null,
        notes: "Cocktail attire recommended.",
        notes2: "Doors open 30 minutes early.",
        notes3: "RSVP by May 30.",
      },
      hostNames: ["Lena", "Marco"],
      rsvpOptions: [
        { key: "yes", label: "We will be there" },
        { key: "no", label: "No thank you" },
        { key: "maybe", label: "Maybe" },
      ],
    }),
    [templateUrl]
  );

  useEffect(() => {
    async function render() {
      if (!templateUrl) {
        setError("Template URL is missing.");
        return;
      }
      try {
        const templateResponse = await fetch(templateUrl, {
          cache: "no-store",
        });
        if (!templateResponse.ok) {
          setError("Template URL is not reachable from this browser.");
          return;
        }
        const templateHtml = await templateResponse.text();
        setHtml(applyPreviewDataToHtml(templateHtml, payload, mode));
      } catch {
        setError("Template URL is not reachable from this browser.");
      }
    }

    render();
  }, [templateUrl, payload, mode]);

  const guestUrl = useMemo(() => `?templateUrl=${encodeURIComponent(templateUrl ?? "")}&mode=guest`, [
    templateUrl,
  ]);
  const openUrl = useMemo(() => `?templateUrl=${encodeURIComponent(templateUrl ?? "")}&mode=open`, [
    templateUrl,
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[var(--foreground)]">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a14] px-5 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Template preview</span>
          <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {mode === "guest" ? "Guest" : "Open"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            className={`rounded-full border px-3 py-1 text-xs ${
              mode === "guest"
                ? "border-[#00f0ff] bg-[#00f0ff] text-[#0a0a14]"
                : "border-white/30 text-white"
            }`}
            href={guestUrl}
          >
            Guest
          </a>
          <a
            className={`rounded-full border px-3 py-1 text-xs ${
              mode === "open"
                ? "border-[#c7ff1a] bg-[#c7ff1a] text-[#0a0a14]"
                : "border-white/30 text-white"
            }`}
            href={openUrl}
          >
            Open
          </a>
        </div>
      </div>

      {error ? (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-[var(--muted)]">
          {error}
        </div>
      ) : html ? (
        <iframe className="h-[calc(100vh-60px)] w-full" srcDoc={html} />
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-[var(--muted)]">
          Loading preview...
        </div>
      )}
    </div>
  );
}
