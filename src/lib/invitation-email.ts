import { formatDate, formatTime } from "@/lib/date-format";
import { getAppUrl } from "@/lib/mailer";

type InvitationSummary = {
  title: string;
  eventDate: string | null;
  eventTime: string | null;
  date: string | null;
  time: string | null;
  dateFormat: string | null;
  timeFormat: string | null;
  locationName: string | null;
  address: string | null;
};

type GuestSummary = {
  displayName: string;
  token: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildInvitationEmail(
  invitation: InvitationSummary,
  guest: GuestSummary,
  mode: "invite" | "update"
) {
  const dateValue = invitation.eventDate ?? invitation.date ?? null;
  const timeValue = invitation.eventTime ?? invitation.time ?? null;
  const formattedDate = formatDate(
    dateValue,
    (invitation.dateFormat ?? "MMM d, yyyy") as
      | "MMM d, yyyy"
      | "MMMM d, yyyy"
      | "EEE, MMM d"
      | "yyyy-MM-dd"
  );
  const formattedTime = formatTime(
    timeValue,
    (invitation.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
  );
  const invitationUrl = `${getAppUrl()}/i/${guest.token}`;

  const eyebrow = mode === "update" ? "Invitation update" : "You're invited";
  const intro =
    mode === "update"
      ? `Your invitation details for ${invitation.title} were updated.`
      : `You are invited to ${invitation.title}.`;
  const cta = mode === "update" ? "View updated invitation" : "Open invitation and RSVP";
  const subject =
    mode === "update"
      ? `Updated invitation: ${invitation.title}`
      : `You're invited: ${invitation.title}`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0a0a14;color:#fef7ff;font-family:Inter,Segoe UI,Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border:1px solid rgba(255,255,255,0.12);border-radius:20px;background:linear-gradient(180deg,#17172e 0%,#111123 100%);overflow:hidden;"><tr><td style="padding:28px;"><p style="margin:0 0 8px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#b7b1d6;">${escapeHtml(eyebrow)}</p><h1 style="margin:0 0 12px;font-size:32px;line-height:1.1;color:#fef7ff;">${escapeHtml(invitation.title)}</h1><p style="margin:0 0 20px;color:#d9d3f0;">Hi ${escapeHtml(guest.displayName)}, ${escapeHtml(intro)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border:1px solid rgba(255,255,255,0.14);border-radius:14px;background:rgba(255,255,255,0.04);"><tr><td style="padding:14px 16px;color:#fef7ff;font-size:14px;line-height:1.6;"><div><strong>When:</strong> ${escapeHtml(formattedDate ?? "TBD")}${formattedTime ? ` at ${escapeHtml(formattedTime)}` : ""}</div>${invitation.locationName ? `<div><strong>Where:</strong> ${escapeHtml(invitation.locationName)}</div>` : ""}${invitation.address ? `<div>${escapeHtml(invitation.address)}</div>` : ""}</td></tr></table><a href="${escapeHtml(invitationUrl)}" style="display:inline-block;padding:12px 18px;background:#ff3d81;color:#0a0a14;text-decoration:none;font-weight:700;border-radius:999px;">${escapeHtml(cta)}</a><p style="margin:18px 0 0;color:#b7b1d6;font-size:12px;">If the button does not work, use this link: ${escapeHtml(invitationUrl)}</p></td></tr></table></td></tr></table></body></html>`;

  const text = `${eyebrow}\n\n${invitation.title}\n\nHi ${guest.displayName}, ${intro}\nWhen: ${formattedDate ?? "TBD"}${formattedTime ? ` at ${formattedTime}` : ""}${invitation.locationName ? `\nWhere: ${invitation.locationName}` : ""}${invitation.address ? `\n${invitation.address}` : ""}\n\n${cta}: ${invitationUrl}`;

  return { subject, html, text };
}
