import sanitizeHtml from "sanitize-html";

export type InvitationTemplateData = {
  title: string;
  date: string | null;
  time: string | null;
  locationName: string | null;
  address: string | null;
  mapLink: string | null;
  notes: string | null;
  hostNames: string;
  rsvpOptions: Array<{ key: string; label: string }>;
  guestDisplayName?: string | null;
  expectedAdults?: number | null;
  expectedKids?: number | null;
  expectedTotal?: number | null;
  responseHtml?: string | null;
};

const allowedTags = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "footer",
  "hr",
  "img",
  "li",
  "main",
  "ol",
  "p",
  "section",
  "span",
  "strong",
  "style",
  "ul",
];

const allowedAttributes = {
  "*": ["class", "id", "style"],
  a: ["href", "target", "rel", "class", "id", "style"],
  img: ["src", "alt", "class", "id", "style"],
};

const placeholderIds = {
  title: "title",
  date: "date",
  time: "time",
  location: "location",
  address: "address",
  notes: "notes",
  hostNames: "host_names",
  rsvpYes: "rsvp_yes_label",
  rsvpNo: "rsvp_no_label",
  rsvpMaybe: "rsvp_maybe_label",
  guestName: "guest_name",
  expectedAdults: "expected_adults",
  expectedKids: "expected_kids",
  expectedTotal: "expected_total",
  mapLink: "map_link",
  response: "response",
} as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setContent(html: string, id: string, value: string | null) {
  if (!value) return html;
  const safe = escapeHtml(value);
  const pattern = new RegExp(
    `<([^>]*?\\bid=["']${id}["'][^>]*)>([\\s\\S]*?)</[^>]+>`,
    "i"
  );
  return html.replace(pattern, `<$1>${safe}</$1>`);
}

function setRawContent(html: string, id: string, value: string | null) {
  if (!value) return html;
  const pattern = new RegExp(
    `<([^>]*?\\bid=["']${id}["'][^>]*)>([\\s\\S]*?)</[^>]+>`,
    "i"
  );
  return html.replace(pattern, `<$1>${value}</$1>`);
}

function setLink(html: string, id: string, href: string | null) {
  if (!href) return html;
  const safe = escapeHtml(href);
  const pattern = new RegExp(
    `<([^>]*?\\bid=["']${id}["'][^>]*?)>`,
    "i"
  );
  return html.replace(pattern, (match, start) => {
    if (start.includes("href=")) return match;
    return `<${start} href=\"${safe}\">`;
  });
}

export function sanitizeTemplate(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}

export function injectTemplateData(html: string, data: InvitationTemplateData) {
  let output = html;
  output = setContent(output, placeholderIds.title, data.title);
  output = setContent(output, placeholderIds.date, data.date);
  output = setContent(output, placeholderIds.time, data.time);
  output = setContent(output, placeholderIds.location, data.locationName);
  output = setContent(output, placeholderIds.address, data.address);
  output = setContent(output, placeholderIds.notes, data.notes);
  output = setContent(output, placeholderIds.hostNames, data.hostNames);
  output = setContent(
    output,
    placeholderIds.guestName,
    data.guestDisplayName ?? null
  );
  output = setContent(
    output,
    placeholderIds.expectedAdults,
    data.expectedAdults != null ? String(data.expectedAdults) : null
  );
  output = setContent(
    output,
    placeholderIds.expectedKids,
    data.expectedKids != null ? String(data.expectedKids) : null
  );
  output = setContent(
    output,
    placeholderIds.expectedTotal,
    data.expectedTotal != null ? String(data.expectedTotal) : null
  );

  const yesOption = data.rsvpOptions.find((option) => option.key === "yes");
  const noOption = data.rsvpOptions.find((option) => option.key === "no");
  const maybeOption = data.rsvpOptions.find((option) => option.key === "maybe");

  output = setContent(output, placeholderIds.rsvpYes, yesOption?.label ?? null);
  output = setContent(output, placeholderIds.rsvpNo, noOption?.label ?? null);
  output = setContent(
    output,
    placeholderIds.rsvpMaybe,
    maybeOption?.label ?? null
  );
  output = setLink(output, placeholderIds.mapLink, data.mapLink);

  if (data.responseHtml) {
    output = setRawContent(output, placeholderIds.response, data.responseHtml);
  }

  return output;
}

export const templatePlaceholders = placeholderIds;
