export const INVITATION_SAFETY_PATH = "/safety";

// Added after template sanitization. A shadow root isolates the notice from
// template styles without requiring JavaScript or changing the invitation CSS.
const safetyNotice = `
<div aria-hidden="true" style="display:block!important;height:72px!important;min-height:72px!important;width:100%!important;flex-shrink:0!important;visibility:hidden!important;"></div>
<openinvite-safety-notice role="note" aria-label="OpenInvite safety notice">
  <template shadowrootmode="open">
    <style>
      :host {
        all: initial !important;
        display: block !important;
        position: fixed !important;
        inset: auto 0 0 0 !important;
        width: 100% !important;
        height: auto !important;
        max-width: none !important;
        max-height: none !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        filter: none !important;
        clip-path: none !important;
        pointer-events: auto !important;
        z-index: 2147483647 !important;
        direction: ltr !important;
        color-scheme: light !important;
      }
      :host::before, :host::after { content: none !important; }
      .notice {
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 9px 16px calc(9px + env(safe-area-inset-bottom, 0px));
        border-top: 1px solid #d7dce2;
        background: #f8fafc;
        color: #475569;
        font: 12px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        text-align: center;
      }
      svg { width: 15px; height: 15px; flex-shrink: 0; }
      a { color: #334155; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; white-space: nowrap; }
      a:hover { color: #0f172a; }
      a:focus-visible { outline: 2px solid #334155; outline-offset: 3px; border-radius: 2px; }
      @media (max-width: 520px) {
        .notice { align-items: flex-start; text-align: left; }
        svg { margin-top: 2px; }
      }
      @media print { :host { position: static !important; } }
    </style>
    <div class="notice">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></svg>
      <span>Invitations are user-created. Be cautious with links and requests. <a href="${INVITATION_SAFETY_PATH}" target="_blank" rel="noopener noreferrer">Safety tips</a></span>
    </div>
  </template>
</openinvite-safety-notice>`;

export function addInvitationSafetyNotice(html: string): string {
  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (bodyClose !== -1) {
    return html.slice(0, bodyClose) + safetyNotice + html.slice(bodyClose);
  }
  const htmlClose = html.toLowerCase().lastIndexOf("</html>");
  if (htmlClose !== -1) {
    return html.slice(0, htmlClose) + safetyNotice + html.slice(htmlClose);
  }
  return html + safetyNotice;
}
