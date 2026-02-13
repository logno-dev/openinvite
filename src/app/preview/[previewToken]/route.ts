import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invitationDetails,
  invitationHosts,
  invitations,
  rsvpOptions,
  users,
} from "@/db/schema";
import { formatDate, formatTime } from "@/lib/date-format";
import { injectTemplateData, sanitizeTemplate } from "@/lib/template";
import { renderRsvpForm } from "@/lib/rsvp";

export const runtime = "nodejs";

async function fetchTemplate(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Template fetch failed");
  }
  return response.text();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ previewToken: string }> }
) {
  const { previewToken } = await params;
  const requestUrl = new URL(request.url);
  const mode = requestUrl.searchParams.get("mode") ?? "open";
  const refreshed = requestUrl.searchParams.get("refreshed") === "1";
    const invitation = await db
    .select({
      id: invitations.id,
      title: invitations.title,
      templateUrlDraft: invitations.templateUrlDraft,
      openRsvpToken: invitations.openRsvpToken,
      countMode: invitations.countMode,
    })
    .from(invitations)
    .where(eq(invitations.previewToken, previewToken))
    .limit(1);

  if (invitation.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const record = invitation[0];
  const templateUrlDraft = record.templateUrlDraft;
  if (!templateUrlDraft) {
    return NextResponse.json({ error: "Template URL missing" }, { status: 400 });
  }

  const details = await db
    .select()
    .from(invitationDetails)
    .where(eq(invitationDetails.invitationId, record.id))
    .limit(1);

  const options = await db
    .select({ key: rsvpOptions.key, label: rsvpOptions.label })
    .from(rsvpOptions)
    .where(eq(rsvpOptions.invitationId, record.id));

  const hostNames = await db
    .select({ name: users.displayName })
    .from(invitationHosts)
    .innerJoin(users, eq(users.id, invitationHosts.userId))
    .where(eq(invitationHosts.invitationId, record.id));

  let injected = "";
  try {
    const html = await fetchTemplate(templateUrlDraft);
    const sanitized = sanitizeTemplate(html);
    const responseHtml =
      mode === "guest"
        ? renderRsvpForm({
            actionUrl: "#",
            guestName: "Preview Guest",
            expectedAdults: 2,
            expectedKids: 0,
            expectedTotal: 2,
            options,
            tokenFieldName: "guestToken",
            tokenValue: "preview",
            countMode: record.countMode === "total" ? "total" : "split",
          })
        : renderRsvpForm({
            actionUrl: "#",
            options,
            tokenFieldName: "openToken",
            tokenValue: record.openRsvpToken ?? "",
            countMode: record.countMode === "total" ? "total" : "split",
          });

    const guestActive = mode === "guest";
    const openActive = mode !== "guest";
    const guestUrl = new URL(requestUrl);
    guestUrl.searchParams.set("mode", "guest");
    guestUrl.searchParams.delete("refreshed");
    const openUrl = new URL(requestUrl);
    openUrl.searchParams.set("mode", "open");
    openUrl.searchParams.delete("refreshed");
    const toolbar = `
      <div style="position:sticky;top:0;z-index:9999;background:#0a0a14;color:#fef7ff;padding:12px 20px;font-family:system-ui;display:flex;gap:12px;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;gap:10px;align-items:center;">
          <strong>Preview</strong>
          <span style="opacity:0.7;">${guestActive ? "Guest" : "Open"}</span>
          ${refreshed ? `<span style="opacity:0.7;">Updated</span>` : ""}
        </div>
        <div style="opacity:0.6;font-size:12px;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${templateUrlDraft}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <a href="${guestUrl.toString()}" style="color:${guestActive ? "#0a0a14" : "#fef7ff"};background:${guestActive ? "#00f0ff" : "transparent"};border:1px solid ${guestActive ? "#00f0ff" : "rgba(255,255,255,0.35)"};padding:6px 12px;border-radius:999px;text-decoration:none;font-weight:600;">Guest</a>
          <a href="${openUrl.toString()}" style="color:${openActive ? "#0a0a14" : "#fef7ff"};background:${openActive ? "#c7ff1a" : "transparent"};border:1px solid ${openActive ? "#c7ff1a" : "rgba(255,255,255,0.35)"};padding:6px 12px;border-radius:999px;text-decoration:none;font-weight:600;">Open</a>
        </div>
      </div>
    `;

    const dateValue = details[0]?.eventDate ?? details[0]?.date ?? null;
    const timeValue = details[0]?.eventTime ?? details[0]?.time ?? null;
    const formattedDate = formatDate(
      dateValue,
      (details[0]?.dateFormat ?? "MMM d, yyyy") as
        | "MMM d, yyyy"
        | "MMMM d, yyyy"
        | "EEE, MMM d"
        | "yyyy-MM-dd"
    );
    const formattedTime = formatTime(
      timeValue,
      (details[0]?.timeFormat ?? "h:mm a") as "h:mm a" | "h a" | "HH:mm"
    );

    injected = injectTemplateData(sanitized, {
      title: record.title,
      date: formattedDate,
      time: formattedTime,
      locationName: details[0]?.locationName ?? null,
      address: details[0]?.address ?? null,
      mapLink: details[0]?.mapLink ?? null,
      mapEmbed: details[0]?.mapEmbed ?? null,
      notes: details[0]?.notes ?? null,
      hostNames: hostNames
        .map((host) => host.name)
        .filter(Boolean)
        .join(" + "),
      rsvpOptions: options,
      guestDisplayName: mode === "guest" ? "Preview Guest" : null,
      expectedAdults: mode === "guest" ? 2 : null,
      expectedKids: mode === "guest" ? 0 : null,
      expectedTotal: mode === "guest" ? 2 : null,
      responseHtml,
      calendarLink: record.openRsvpToken ? `/api/calendar/${record.openRsvpToken}` : null,
    });

    if (/<body[^>]*>/i.test(injected)) {
      injected = injected.replace(/<body[^>]*>/i, (match) => `${match}${toolbar}`);
    } else {
      injected = `${toolbar}${injected}`;
    }
  } catch {
    injected = `<!doctype html><html><head><meta charset="utf-8"><title>Template not available</title></head><body style="font-family: sans-serif; padding: 40px; background: #0a0a14; color: #fef7ff;"><h1>Template not available</h1><p>Check that the draft template URL is reachable and currently serving HTML.</p></body></html>`;
    return new NextResponse(injected, {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new NextResponse(injected, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline' https:; frame-src https://www.google.com/maps https://www.google.com/maps/embed;",
    },
  });
}
