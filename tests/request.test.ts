import assert from "node:assert/strict";
import { test } from "node:test";
import { safeRedirectPath } from "../src/lib/navigation";
import { readStringFields } from "../src/lib/request";

test("post-login redirects only allow local paths", () => {
  for (const input of [null, "", "javascript:alert(1)", "https://evil.example", "//evil.example", "/\\evil.example", "/\n/evil.example"]) {
    assert.equal(safeRedirectPath(input, "/dashboard"), "/dashboard");
  }
  assert.equal(safeRedirectPath("/my-invitations?foo=bar", "/dashboard"), "/my-invitations?foo=bar");
});

test("auth payload validation rejects malformed JSON and non-string fields", async () => {
  for (const body of ["{", "null", "[]", "42", '{"email":42}', '{"password":{}}']) {
    const request = new Request("https://example.com", { method: "POST", body });
    assert.equal(await readStringFields(request, ["email", "password"]), null);
  }
});

test("auth payload validation accepts optional strings", async () => {
  const request = new Request("https://example.com", {
    method: "POST", body: JSON.stringify({ email: "guest@example.com", extra: true }),
  });
  assert.deepEqual(await readStringFields(request, ["email", "password"]), { email: "guest@example.com" });
});
