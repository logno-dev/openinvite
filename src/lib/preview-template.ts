import { renderRsvpForm } from "@/lib/rsvp";
import { formatDate, formatTime } from "@/lib/date-format";

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
