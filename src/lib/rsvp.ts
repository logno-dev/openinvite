import type { InvitationTemplateData } from "@/lib/template";

type RsvpRenderInput = {
  actionUrl: string;
  guestName?: string | null;
  expectedAdults?: number | null;
  expectedKids?: number | null;
  expectedTotal?: number | null;
  options: InvitationTemplateData["rsvpOptions"];
  tokenFieldName: "guestToken" | "openToken";
  tokenValue: string;
  countMode?: "split" | "total";
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderRsvpForm(input: RsvpRenderInput) {
  const options = input.options
    .map((option) => {
      return `
        <label class="oi-rsvp-option">
          <input class="oi-rsvp-radio" type="radio" name="response" value="${escapeHtml(option.key)}" required />
          <span class="oi-rsvp-label">${escapeHtml(option.label)}</span>
        </label>
      `;
    })
    .join("");

  const guestName = input.guestName ? escapeHtml(input.guestName) : "";
  const adults = input.expectedAdults ?? 0;
  const kids = input.expectedKids ?? 0;
  const total = input.expectedTotal ?? adults + kids;

  const guestNameField =
    input.tokenFieldName === "openToken"
      ? `
        <div class="oi-field">
          <label class="oi-label">Guest name</label>
          <input class="oi-input" type="text" name="guestName" placeholder="Your name" required />
        </div>
      `
      : "";

  const countMode = input.countMode ?? "split";

  const countFields =
    countMode === "split"
      ? `
        <div class="oi-field">
          <label class="oi-label">Adults</label>
          <input class="oi-input" type="number" min="0" name="adults" value="${adults}" />
        </div>
        <div class="oi-field">
          <label class="oi-label">Kids</label>
          <input class="oi-input" type="number" min="0" name="kids" value="${kids}" />
        </div>
      `
      : `
        <div class="oi-field">
          <label class="oi-label">Total</label>
          <input class="oi-input" type="number" min="0" name="total" value="${total}" />
        </div>
      `;

  return `
    <form class="oi-rsvp-form" action="${escapeHtml(input.actionUrl)}" method="post">
      <input class="oi-hidden" type="hidden" name="${input.tokenFieldName}" value="${escapeHtml(input.tokenValue)}" />
      ${guestName ? `<div class="oi-guest-name">Guest: ${guestName}</div>` : ""}
      ${guestNameField}
      ${countFields}
      <div class="oi-field">
        <label class="oi-label">Message</label>
        <textarea class="oi-textarea" name="message" rows="3"></textarea>
      </div>
      <div class="oi-rsvp-options">
        ${options}
      </div>
      <button class="oi-submit" type="submit">Submit RSVP</button>
    </form>
  `;
}
