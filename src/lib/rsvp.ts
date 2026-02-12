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
        <label style="display:block;margin:8px 0;">
          <input type="radio" name="response" value="${escapeHtml(option.key)}" required />
          <span>${escapeHtml(option.label)}</span>
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
        <div>
          <label>Guest name</label>
          <input type="text" name="guestName" placeholder="Your name" required />
        </div>
      `
      : "";

  return `
    <form action="${escapeHtml(input.actionUrl)}" method="post" style="display:grid;gap:12px;">
      <input type="hidden" name="${input.tokenFieldName}" value="${escapeHtml(input.tokenValue)}" />
      ${guestName ? `<div>Guest: ${guestName}</div>` : ""}
      ${guestNameField}
      <div>
        <label>Adults</label>
        <input type="number" min="0" name="adults" value="${adults}" />
      </div>
      <div>
        <label>Kids</label>
        <input type="number" min="0" name="kids" value="${kids}" />
      </div>
      <div>
        <label>Total</label>
        <input type="number" min="0" name="total" value="${total}" />
      </div>
      <div>
        <label>Message</label>
        <textarea name="message" rows="3"></textarea>
      </div>
      <div>
        ${options}
      </div>
      <button type="submit">Submit RSVP</button>
    </form>
  `;
}
