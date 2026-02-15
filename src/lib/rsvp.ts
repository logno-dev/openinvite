import type { InvitationTemplateData } from "@/lib/template";

type RsvpRenderInput = {
  actionUrl: string;
  guestName?: string | null;
  expectedAdults?: number | null;
  expectedKids?: number | null;
  expectedTotal?: number | null;
  responseOptionKey?: string | null;
  responseAdults?: number | null;
  responseKids?: number | null;
  responseTotal?: number | null;
  responseMessage?: string | null;
  options: InvitationTemplateData["rsvpOptions"];
  tokenFieldName: "guestToken" | "openToken";
  tokenValue: string;
  countMode?: "split" | "total";
  allowOpenCount?: boolean;
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
  const selectedOption = input.responseOptionKey ?? "";
  const options = input.options
    .map((option) => {
      const checked = option.key === selectedOption ? "checked" : "";
      return `
        <label class="oi-rsvp-option">
          <input class="oi-rsvp-radio" type="radio" name="response" value="${escapeHtml(option.key)}" ${checked} required />
          <span class="oi-rsvp-label">${escapeHtml(option.label)}</span>
        </label>
      `;
    })
    .join("");

  const guestName = input.guestName ? escapeHtml(input.guestName) : "";
  const adults = input.responseAdults ?? input.expectedAdults ?? 0;
  const kids = input.responseKids ?? input.expectedKids ?? 0;
  const total = input.responseTotal ?? input.expectedTotal ?? adults + kids;
  const message = input.responseMessage ? escapeHtml(input.responseMessage) : "";

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
  const countReadonly = "";
  const adultsMax = input.expectedAdults ?? 0;
  const kidsMax = input.expectedKids ?? 0;
  const totalMax = input.expectedTotal ?? adultsMax + kidsMax;
  const adultsMaxAttr = input.allowOpenCount === false ? `max="${adultsMax}"` : "";
  const kidsMaxAttr = input.allowOpenCount === false ? `max="${kidsMax}"` : "";
  const totalMaxAttr = input.allowOpenCount === false ? `max="${totalMax}"` : "";
  const adultsLimit = input.allowOpenCount === false
    ? `<div class="oi-limit">Limit: ${adultsMax}</div>`
    : "";
  const kidsLimit = input.allowOpenCount === false
    ? `<div class="oi-limit">Limit: ${kidsMax}</div>`
    : "";
  const totalLimit = input.allowOpenCount === false
    ? `<div class="oi-limit">Limit: ${totalMax}</div>`
    : "";

  const countFields =
    countMode === "split"
      ? `
        <div class="oi-field">
          <label class="oi-label">Adults</label>
          ${adultsLimit}
          <input class="oi-input" type="number" min="0" ${adultsMaxAttr} name="adults" value="${adults}" ${countReadonly} />
        </div>
        <div class="oi-field">
          <label class="oi-label">Kids</label>
          ${kidsLimit}
          <input class="oi-input" type="number" min="0" ${kidsMaxAttr} name="kids" value="${kids}" ${countReadonly} />
        </div>
      `
      : `
        <div class="oi-field">
          <label class="oi-label">Total</label>
          ${totalLimit}
          <input class="oi-input" type="number" min="0" ${totalMaxAttr} name="total" value="${total}" ${countReadonly} />
        </div>
      `;

  return `
    <form class="oi-rsvp-form" action="${escapeHtml(input.actionUrl)}" method="post" onsubmit="if(this.dataset.submitting==='1'){return false;}this.dataset.submitting='1';var btn=this.querySelector('button[type=submit]');if(btn){btn.disabled=true;btn.textContent='Submitting...';}return true;">
      <input class="oi-hidden" type="hidden" name="${input.tokenFieldName}" value="${escapeHtml(input.tokenValue)}" />
      ${guestName ? `<div class="oi-guest-name">Guest: ${guestName}</div>` : ""}
      ${guestNameField}
      ${countFields}
      <div class="oi-field">
        <label class="oi-label">Message</label>
        <textarea class="oi-textarea" name="message" rows="3">${message}</textarea>
      </div>
      <div class="oi-rsvp-options">
        ${options}
      </div>
      <button class="oi-submit" type="submit">Submit RSVP</button>
    </form>
  `;
}
