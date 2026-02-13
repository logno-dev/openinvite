"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { renderRsvpForm } from "@/lib/rsvp";
import { formatDate, formatTime } from "@/lib/date-format";

type PreviewPayload = {
  invitation: {
    id: string;
    title: string;
    templateUrlDraft: string | null;
    openRsvpToken: string | null;
    timezone: string;
    countMode: "split" | "total" | string;
  };
  details: {
    date: string | null;
    time: string | null;
    eventDate: string | null;
    eventTime: string | null;
    dateFormat: string | null;
    timeFormat: string | null;
    locationName: string | null;
    address: string | null;
    mapLink: string | null;
    mapEmbed: string | null;
    notes: string | null;
  } | null;
  hostNames: string[];
  rsvpOptions: Array<{ key: string; label: string }>;
};

function applyDataToHtml(html: string, data: PreviewPayload, mode: "guest" | "open") {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const details = data.details;
  const dateValue = details?.eventDate ?? details?.date ?? null;
  const timeValue = details?.eventTime ?? details?.time ?? null;
  const formattedDate = formatDate(
    dateValue,
    (details?.dateFormat ?? "MMM d, yyyy") as
      | "MMM d, yyyy"
      | "MMMM d, yyyy"
      | "EEE, MMM d"
      | "yyyy-MM-dd"
  );
  const formattedTime = formatTime(
    timeValue,
    (details?.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
  );

  const placeholders: Record<string, string | null> = {
    title: data.invitation.title,
    date: formattedDate,
    time: formattedTime,
    location: details?.locationName ?? null,
    address: details?.address ?? null,
    notes: details?.notes ?? null,
    host_names: data.hostNames.join(" + ") || null,
    rsvp_yes_label: data.rsvpOptions.find((opt) => opt.key === "yes")?.label ?? null,
    rsvp_no_label: data.rsvpOptions.find((opt) => opt.key === "no")?.label ?? null,
    rsvp_maybe_label: data.rsvpOptions.find((opt) => opt.key === "maybe")?.label ?? null,
    guest_name: mode === "guest" ? "Preview Guest" : null,
    expected_adults: mode === "guest" ? "2" : null,
    expected_kids: mode === "guest" ? "0" : null,
    expected_total: mode === "guest" ? "2" : null,
  };

  Object.entries(placeholders).forEach(([id, value]) => {
    const el = doc.getElementById(id);
    if (!el) return;
    if (!value) {
      el.remove();
      return;
    }
    el.textContent = value;
  });

  const mapEl = doc.getElementById("map_link");
  if (mapEl) {
    if (details?.mapEmbed) {
      mapEl.innerHTML = details.mapEmbed;
    } else if (details?.mapLink) {
      if (mapEl.tagName.toLowerCase() === "a") {
        (mapEl as HTMLAnchorElement).href = details.mapLink;
        mapEl.textContent = details.mapLink;
      } else {
        mapEl.textContent = details.mapLink;
      }
    } else {
      mapEl.remove();
    }
  }

  const responseEl = doc.getElementById("response");
  if (responseEl) {
    const responseHtml =
      mode === "guest"
        ? renderRsvpForm({
            actionUrl: "#",
            guestName: "Preview Guest",
            expectedAdults: 2,
            expectedKids: 0,
            expectedTotal: 2,
            options: data.rsvpOptions,
            tokenFieldName: "guestToken",
            tokenValue: "preview",
            countMode: data.invitation.countMode === "total" ? "total" : "split",
          })
        : renderRsvpForm({
            actionUrl: "#",
            options: data.rsvpOptions,
            tokenFieldName: "openToken",
            tokenValue: data.invitation.openRsvpToken ?? "",
            countMode: data.invitation.countMode === "total" ? "total" : "split",
          });
    responseEl.innerHTML = responseHtml;
  }

  const calendarEl = doc.getElementById("calendar_link");
  if (calendarEl) {
    if (data.invitation.openRsvpToken) {
      const link = `/api/calendar/${data.invitation.openRsvpToken}`;
      calendarEl.innerHTML = `<a class="oi-calendar-link" href="${link}">Add to calendar</a>`;
    } else {
      calendarEl.remove();
    }
  }

  doc.title = data.invitation.title;
  return "<!doctype html>" + doc.documentElement.outerHTML;
}

export default function PreviewClientPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = typeof params.previewToken === "string" ? params.previewToken : "";
  const mode = (searchParams.get("mode") ?? "open") === "guest" ? "guest" : "open";
  const [payload, setPayload] = useState<PreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const response = await fetch(`/api/preview/${token}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Preview not found");
        return;
      }
      setPayload(data);
    }

    load();
  }, [token]);

  useEffect(() => {
    async function render() {
      if (!payload || !payload.invitation.templateUrlDraft) return;
      try {
        const templateResponse = await fetch(payload.invitation.templateUrlDraft, {
          cache: "no-store",
        });
        if (!templateResponse.ok) {
          setError("Template URL is not reachable from this browser.");
          return;
        }
        const templateHtml = await templateResponse.text();
        setHtml(applyDataToHtml(templateHtml, payload, mode));
      } catch {
        setError("Template URL is not reachable from this browser.");
      }
    }

    render();
  }, [payload, mode]);

  const guestUrl = useMemo(() => `?mode=guest`, []);
  const openUrl = useMemo(() => `?mode=open`, []);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[var(--foreground)]">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0a0a14] px-5 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Client preview</span>
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
