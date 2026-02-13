import sanitizeHtml from "sanitize-html";

export type InvitationTemplateData = {
  title: string;
  date: string | null;
  time: string | null;
  locationName: string | null;
  address: string | null;
  mapLink: string | null;
  mapEmbed: string | null;
  notes: string | null;
  hostNames: string;
  rsvpOptions: Array<{ key: string; label: string }>;
  guestDisplayName?: string | null;
  expectedAdults?: number | null;
  expectedKids?: number | null;
  expectedTotal?: number | null;
  responseHtml?: string | null;
  calendarLink?: string | null;
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
  "iframe",
  "li",
  "link",
  "main",
  "meta",
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
  link: ["href", "rel", "as", "type", "crossorigin"],
  iframe: [
    "src",
    "title",
    "loading",
    "allowfullscreen",
    "referrerpolicy",
    "class",
    "id",
    "style",
    "width",
    "height",
  ],
  meta: ["charset", "name", "content", "http-equiv"],
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
  calendarLink: "calendar_link",
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

function ensureTitle(html: string, title: string) {
  const safe = escapeHtml(title);
  if (/<title>.*?<\/title>/i.test(html)) {
    return html.replace(/<title>.*?<\/title>/i, `<title>${safe}</title>`);
  }

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}<title>${safe}</title>`);
  }

  return `<head><title>${safe}</title></head>${html}`;
}

function setRawContent(html: string, id: string, value: string | null) {
  if (!value) return html;
  const pattern = new RegExp(
    `<([^>]*?\\bid=["']${id}["'][^>]*)>([\\s\\S]*?)</[^>]+>`,
    "i"
  );
  return html.replace(pattern, `<$1>${value}</$1>`);
}

function removeElementById(html: string, id: string) {
  const pattern = new RegExp(
    `<[^>]*?\\bid=["']${id}["'][^>]*>[\\s\\S]*?</[^>]+>`,
    "i"
  );
  return html.replace(pattern, "");
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

function makeGoogleMapsEmbedUrl(value: string) {
  if (value.includes("/maps/embed")) return value;
  const encoded = encodeURIComponent(value);
  return `https://www.google.com/maps?q=${encoded}&output=embed`;
}

function ensureIframeClass(html: string, className: string) {
  return html.replace(/<iframe\b([^>]*)>/i, (match, attrs) => {
    const classMatch = attrs.match(/\bclass=("[^"]*"|'[^']*')/i);
    if (classMatch) {
      const quote = classMatch[1][0];
      const value = classMatch[1].slice(1, -1);
      if (value.split(/\s+/).includes(className)) {
        return match;
      }
      const updated = `${quote}${value} ${className}${quote}`;
      return match.replace(classMatch[1], updated);
    }
    return `<iframe class="${className}"${attrs}>`;
  });
}

export function sanitizeTemplate(html: string) {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      iframe: ["https"],
      link: ["https"],
    },
    disallowedTagsMode: "discard",
  });
}

export function injectTemplateData(html: string, data: InvitationTemplateData) {
  let output = html;
  output = ensureTitle(output, data.title);
  output = setContent(output, placeholderIds.title, data.title);
  output = data.date
    ? setContent(output, placeholderIds.date, data.date)
    : removeElementById(output, placeholderIds.date);
  output = data.time
    ? setContent(output, placeholderIds.time, data.time)
    : removeElementById(output, placeholderIds.time);
  output = data.locationName
    ? setContent(output, placeholderIds.location, data.locationName)
    : removeElementById(output, placeholderIds.location);
  output = data.address
    ? setContent(output, placeholderIds.address, data.address)
    : removeElementById(output, placeholderIds.address);
  output = data.notes
    ? setContent(output, placeholderIds.notes, data.notes)
    : removeElementById(output, placeholderIds.notes);
  output = data.hostNames
    ? setContent(output, placeholderIds.hostNames, data.hostNames)
    : removeElementById(output, placeholderIds.hostNames);
  output = setContent(
    output,
    placeholderIds.guestName,
    data.guestDisplayName ?? null
  );
  if (data.guestDisplayName) {
    output = setContent(output, placeholderIds.guestName, data.guestDisplayName);
  } else {
    output = removeElementById(output, placeholderIds.guestName);
  }
  output = data.expectedAdults != null
    ? setContent(output, placeholderIds.expectedAdults, String(data.expectedAdults))
    : removeElementById(output, placeholderIds.expectedAdults);
  output = data.expectedKids != null
    ? setContent(output, placeholderIds.expectedKids, String(data.expectedKids))
    : removeElementById(output, placeholderIds.expectedKids);
  output = data.expectedTotal != null
    ? setContent(output, placeholderIds.expectedTotal, String(data.expectedTotal))
    : removeElementById(output, placeholderIds.expectedTotal);

  const yesOption = data.rsvpOptions.find((option) => option.key === "yes");
  const noOption = data.rsvpOptions.find((option) => option.key === "no");
  const maybeOption = data.rsvpOptions.find((option) => option.key === "maybe");

  output = yesOption?.label
    ? setContent(output, placeholderIds.rsvpYes, yesOption.label)
    : removeElementById(output, placeholderIds.rsvpYes);
  output = noOption?.label
    ? setContent(output, placeholderIds.rsvpNo, noOption.label)
    : removeElementById(output, placeholderIds.rsvpNo);
  output = maybeOption?.label
    ? setContent(output, placeholderIds.rsvpMaybe, maybeOption.label)
    : removeElementById(output, placeholderIds.rsvpMaybe);
  if (data.mapEmbed) {
    const sanitizedEmbed = sanitizeHtml(data.mapEmbed, {
      allowedTags: ["iframe"],
      allowedAttributes: {
        iframe: [
          "src",
          "title",
          "loading",
          "allowfullscreen",
          "referrerpolicy",
          "class",
          "id",
          "style",
          "width",
          "height",
        ],
      },
      allowedSchemesByTag: {
        iframe: ["https"],
      },
      disallowedTagsMode: "discard",
    });
    const embedWithClass = ensureIframeClass(sanitizedEmbed, "oi-map-embed");
    output = setRawContent(output, placeholderIds.mapLink, embedWithClass);
  } else if (data.mapLink) {
    const anchorPattern = new RegExp(
      `<a[^>]*?\\bid=["']${placeholderIds.mapLink}["'][^>]*?>`,
      "i"
    );
    if (anchorPattern.test(output)) {
      output = setLink(output, placeholderIds.mapLink, data.mapLink);
      output = setContent(output, placeholderIds.mapLink, data.mapLink);
    } else {
      const embedUrl = makeGoogleMapsEmbedUrl(data.mapLink);
      const iframe = `<iframe class="oi-map-embed" src="${escapeHtml(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="border:0;width:100%;height:320px;"></iframe>`;
      output = setRawContent(output, placeholderIds.mapLink, iframe);
    }
  } else {
    output = removeElementById(output, placeholderIds.mapLink);
  }

  if (data.responseHtml) {
    output = setRawContent(output, placeholderIds.response, data.responseHtml);
  } else {
    output = removeElementById(output, placeholderIds.response);
  }

  if (data.calendarLink) {
    const calendarAnchor = `<a class="oi-calendar-link" href="${escapeHtml(
      data.calendarLink
    )}">Add to calendar</a>`;
    output = setRawContent(output, placeholderIds.calendarLink, calendarAnchor);
  } else {
    output = removeElementById(output, placeholderIds.calendarLink);
  }

  return output;
}

export const templatePlaceholders = placeholderIds;
