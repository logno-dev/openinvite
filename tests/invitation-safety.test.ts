import assert from "node:assert/strict";
import { test } from "node:test";
import { addInvitationSafetyNotice, INVITATION_SAFETY_PATH } from "../src/lib/invitation-safety";
import { sanitizeTemplate } from "../src/lib/template";

test("the safety notice is added inside the document after invitation content", () => {
  const html = '<!doctype html><html><head><title>Party</title><style>body::after{content:"</body>"}</style></head><body><main>Invitation</main></body></html>';
  const result = addInvitationSafetyNotice(html);
  assert.ok(result.startsWith(html.slice(0, html.lastIndexOf("</body>"))));
  assert.ok(result.endsWith("</body></html>"));
  assert.ok(result.indexOf("<openinvite-safety-notice") > result.indexOf("</main>"));
  assert.ok(result.includes('shadowrootmode="open"'));
  assert.ok(!result.includes("<script"));
});

test("the app-owned safety link survives the template link restriction", () => {
  const template = sanitizeTemplate('<main><a href="https://untrusted.example">Designer link</a></main>');
  const result = addInvitationSafetyNotice(template);
  assert.ok(!result.includes("untrusted.example"));
  assert.ok(result.includes(`href="${INVITATION_SAFETY_PATH}" target="_blank" rel="noopener noreferrer"`));
  assert.ok(result.includes("Invitations are user-created."));
  assert.equal((result.match(/<openinvite-safety-notice/g) ?? []).length, 1);
});

test("fragment and headless documents also receive the notice", () => {
  assert.ok(addInvitationSafetyNotice("<main>Invitation</main>").startsWith("<main>Invitation</main>"));
  const result = addInvitationSafetyNotice("<html><main>Invitation</main></html>");
  assert.ok(result.indexOf("<openinvite-safety-notice") < result.lastIndexOf("</html>"));
});
