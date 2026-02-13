import type { DateFormatKey, TimeFormatKey } from "@/lib/date-format";

type IcsInput = {
  title: string;
  locationName: string | null;
  address: string | null;
  notes: string | null;
  eventDate: string | null;
  eventTime: string | null;
  timezone: string;
  uid: string;
};

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function toIcsDate(date: string) {
  return date.replace(/-/g, "");
}

function toIcsTime(time: string) {
  return time.replace(":", "");
}

export function buildIcs(input: IcsInput) {
  if (!input.eventDate) {
    return null;
  }

  const date = toIcsDate(input.eventDate);
  const tzid = input.timezone || "UTC";
  let dtStart = `DTSTART;VALUE=DATE:${date}`;
  let dtEnd = `DTEND;VALUE=DATE:${date}`;

  if (input.eventTime) {
    const time = toIcsTime(input.eventTime);
    dtStart = `DTSTART;TZID=${tzid}:${date}T${time}00`;
    dtEnd = `DURATION:PT2H`;
  }

  const locationParts = [input.locationName, input.address].filter(Boolean);
  const location = locationParts.length > 0 ? escapeText(locationParts.join(" — ")) : "";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenInvite//EN",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `SUMMARY:${escapeText(input.title)}`,
    location ? `LOCATION:${location}` : null,
    input.notes ? `DESCRIPTION:${escapeText(input.notes)}` : null,
    dtStart,
    dtEnd,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
