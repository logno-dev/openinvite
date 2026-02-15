import { renderRsvpForm } from "@/lib/rsvp";
import { formatDate, formatTime } from "@/lib/date-format";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeMarkdownHref(value: string) {
  const href = value.trim();
  if (/^(https?:\/\/|mailto:|\/)/i.test(href)) {
    return href;
  }
  return null;
}

function renderInlineMarkdown(value: string) {
  let output = escapeHtml(value);
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
    const safeHref = sanitizeMarkdownHref(href);
    if (!safeHref) return label;
    return `<a href="${escapeHtml(
      safeHref
    )}" target="_blank" rel="noreferrer">${label}</a>`;
  });
  output = output.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  return output;
}

function renderLimitedMarkdown(value: string) {
  const lines = value.replace(/\r\n|\r/g, "\n").split("\n");
  const listItems: string[] = [];
  let output = "";

  const append = (fragment: string) => {
    output = output ? `${output}<br>${fragment}` : fragment;
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    append(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems.length = 0;
  };

  for (const rawLine of lines) {
    const listMatch = rawLine.match(/^\s*-\s+(.+)$/);
    if (listMatch) {
      listItems.push(renderInlineMarkdown(listMatch[1]));
      continue;
    }

    flushList();
    if (!rawLine.trim()) {
      append("<br>");
      continue;
    }

    append(renderInlineMarkdown(rawLine));
  }

  flushList();
  return output;
}

export type PreviewPayload = {
  invitation: {
    id: string;
    title: string;
    templateUrlDraft: string | null;
    templateUrlLive: string | null;
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
    registryLink: string | null;
    mapEmbed: string | null;
    notes: string | null;
    notes2: string | null;
    notes3: string | null;
  } | null;
  hostNames: string[];
  rsvpOptions: Array<{ key: string; label: string }>;
};

export function applyPreviewDataToHtml(
  html: string,
  data: PreviewPayload,
  mode: "guest" | "open"
) {
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
    notes_2: details?.notes2 ?? null,
    notes_3: details?.notes3 ?? null,
    host_names: data.hostNames.join(" + ") || null,
    rsvp_yes_label: data.rsvpOptions.find((opt) => opt.key === "yes")?.label ?? null,
    rsvp_no_label: data.rsvpOptions.find((opt) => opt.key === "no")?.label ?? null,
    rsvp_maybe_label: data.rsvpOptions.find((opt) => opt.key === "maybe")?.label ?? null,
    guest_name: mode === "guest" ? "Preview Guest" : null,
    expected_adults: mode === "guest" ? "2" : null,
    expected_kids: mode === "guest" ? "0" : null,
    expected_total: mode === "guest" ? "2" : null,
  };
  const multilineIds = new Set(["address", "notes", "notes_2", "notes_3"]);

  Object.entries(placeholders).forEach(([id, value]) => {
    const el = doc.getElementById(id);
    if (!el) return;
    if (!value) {
      el.remove();
      return;
    }
    if (multilineIds.has(id)) {
      el.innerHTML = renderLimitedMarkdown(value);
    } else {
      el.textContent = value;
    }
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

  const registryEl = doc.getElementById("registry_link");
  if (registryEl) {
    if (details?.registryLink) {
      registryEl.innerHTML = `<a href="${escapeHtml(
        details.registryLink
      )}" target="_blank" rel="noreferrer">Gift Registry</a>`;
    } else {
      registryEl.remove();
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
