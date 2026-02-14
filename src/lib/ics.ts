import type { DateFormatKey, TimeFormatKey } from "@/lib/date-format";

type IcsInput = {
  title: string;
  locationName: string | null;
  address: string | null;
  notes: string | null;
  notes2: string | null;
  notes3: string | null;
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

function addOneDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + 1);
  const yyyy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(base.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isValidTz(tz: string) {
  return tz === "UTC" || tz.includes("/");
}

function utcTimestamp() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const min = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

export function buildIcs(input: IcsInput) {
  if (!input.eventDate) {
    return null;
  }

  const date = toIcsDate(input.eventDate);
  const tzid = input.timezone || "UTC";
  let dtStart = `DTSTART;VALUE=DATE:${date}`;
  let dtEnd = `DTEND;VALUE=DATE:${toIcsDate(addOneDay(input.eventDate))}`;

  if (input.eventTime) {
    const time = toIcsTime(input.eventTime);
    if (isValidTz(tzid)) {
      dtStart = `DTSTART;TZID=${tzid}:${date}T${time}00`;
      dtEnd = `DURATION:PT2H`;
    } else {
      dtStart = `DTSTART:${date}T${time}00Z`;
      dtEnd = `DURATION:PT2H`;
    }
  }

  const locationParts = [input.locationName, input.address].filter(Boolean);
  const location = locationParts.length > 0 ? escapeText(locationParts.join(" — ")) : "";
  const combinedNotes = [input.notes, input.notes2, input.notes3]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OpenInvite//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTAMP:${utcTimestamp()}`,
    `UID:${input.uid}`,
    `SUMMARY:${escapeText(input.title)}`,
    location ? `LOCATION:${location}` : null,
    combinedNotes ? `DESCRIPTION:${escapeText(combinedNotes)}` : null,
    dtStart,
    dtEnd,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
