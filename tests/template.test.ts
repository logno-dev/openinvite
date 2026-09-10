import assert from "node:assert/strict";
import { test } from "node:test";
import { injectTemplateData, sanitizeTemplate, type InvitationTemplateData } from "../src/lib/template";

const data: InvitationTemplateData = {
  title: "Party",
  date: null,
  time: null,
  locationName: null,
  address: null,
  mapLink: null,
  mapEmbed: null,
  notes: null,
  notes2: null,
  notes3: null,
  hostNames: "",
  rsvpOptions: [],
};

test("template document titles do not become visible invitation text", () => {
  const sanitized = sanitizeTemplate(
    '<!doctype html><html><head><title>Garden Party Template</title></head><body><main><h1 id="title">Placeholder</h1></main></body></html>'
  );
  assert.equal(sanitized, '<html><head></head><body><main><h1 id="title">Placeholder</h1></main></body></html>');
  const result = injectTemplateData(sanitized, data);
  assert.ok(!result.includes("Garden Party Template"));
  assert.equal(result, '<!doctype html><html><head><title>Party</title></head><body><main><h1 id="title">Party</h1></main></body></html>');
});

test("a header element is not mistaken for the document head", () => {
  const result = injectTemplateData('<header class="hero"><h1 id="title"></h1></header>', data);
  assert.equal(result, '<head><title>Party</title></head><header class="hero"><h1 id="title">Party</h1></header>');
});

test("public rendering preserves SVG artwork, local references, and layout wrappers", () => {
  const html = '<html lang="en" class="birthday"><head></head><body class="paper"><article class="invitation" aria-label="Birthday"><svg class="birthday-art" viewBox="0 0 460 540" fill="none"><defs><g id="daisy"><ellipse cy="-28" rx="12" ry="23" transform="rotate(45)"></ellipse></g><linearGradient id="gold"><stop offset="0" stop-color="#f9e995"></stop></linearGradient></defs><path fill="#a82d59" fill-rule="evenodd" d="M220 138L129 211Z"></path><use href="#daisy" transform="translate(97 133)"></use><rect width="130" height="45" fill="url(#gold)"></rect><text x="328" y="96" text-anchor="middle">OH, HAPPY DAY!</text></svg><div id="title"></div></article></body></html>';
  const result = injectTemplateData(sanitizeTemplate(html), data);
  assert.ok(result.includes('<html lang="en" class="birthday">'));
  assert.ok(result.includes('<body class="paper"><article class="invitation" aria-label="Birthday">'));
  assert.ok(result.includes('<svg class="birthday-art" viewbox="0 0 460 540" fill="none">'));
  assert.ok(result.includes('<path fill="#a82d59" fill-rule="evenodd" d="M220 138L129 211Z"></path>'));
  assert.ok(result.includes('<use href="#daisy" transform="translate(97 133)"></use>'));
  assert.ok(result.includes('<ellipse cy="-28" rx="12" ry="23" transform="rotate(45)"></ellipse>'));
  assert.ok(result.includes('<text x="328" y="96" text-anchor="middle">OH, HAPPY DAY!</text></svg>'));
  assert.ok(result.includes('<linearGradient id="gold"><stop offset="0" stop-color="#f9e995"></stop></linearGradient>'));
});

test("SVG support removes scripts, event handlers, embedded HTML, animation, and external references", () => {
  const result = sanitizeTemplate('<svg onload="alert(1)"><script>alert(2)</script><foreignObject><div>Embedded HTML</div></foreignObject><animate attributeName="href" values="javascript:alert(3)"></animate><set attributeName="onload" to="alert(4)"></set><use href="https://evil.example/art.svg#x"></use><use xlink:href="javascript:alert(5)"></use><use href="#safe"></use><path d="M0 0L10 10" onclick="alert(6)"></path></svg>');
  assert.ok(!/alert|foreignobject|Embedded HTML|animate|<set|https:\/\/evil/.test(result));
  assert.ok(result.includes('<use href="#safe"></use>'));
  assert.ok(result.includes('<path d="M0 0L10 10"></path>'));
});

test("template values preserve dollar sequences and cannot inject markup", () => {
  const result = injectTemplateData(
    '<head><title>Old</title></head><h1 id="title" class="heading"><span>Old</span></h1>',
    { ...data, title: '$& $1 <img src=x onerror="alert(1)">' }
  );
  assert.ok(result.includes('<h1 id="title" class="heading">$&amp; $1 &lt;img'));
  assert.ok(result.includes('</h1>'));
  assert.ok(!result.includes('</h1 id='));
  assert.ok(!result.includes('<img'));
  assert.ok(result.includes('<title>$&amp; $1 &lt;img'));
});

test("multiline and raw placeholders keep valid closing tags", () => {
  const result = injectTemplateData(
    '<section id="notes"><p>Old</p></section><div id="response">Old</div>',
    { ...data, notes: "**Bring snacks**\n- Fruit", responseHtml: '<form action="/api/rsvp">$&</form>' }
  );
  assert.ok(result.includes('<section id="notes"><strong>Bring snacks</strong><br><ul><li>Fruit</li></ul></section>'));
  assert.ok(result.includes('<div id="response"><form action="/api/rsvp">$&</form></div>'));
});

test("unsafe map, registry, and calendar schemes are neutralized", () => {
  const result = injectTemplateData(
    '<a id="map_link" href="https://old.example">Map</a><div id="registry_link"></div><div id="calendar_link"></div>',
    { ...data, mapLink: "javascript:alert(1)", registryLink: "data:text/html,bad", calendarLink: "javascript:alert(2)" }
  );
  assert.ok(!result.includes("javascript:"));
  assert.ok(!result.includes("data:text/html"));
  assert.ok(!result.includes("https://old.example"));
  assert.ok(result.includes('<a id="map_link" href="#">Map Link</a>'));
});

test("map links replace existing template hrefs and escape query strings", () => {
  const result = injectTemplateData('<a id="map_link" href="https://old.example">Map</a>', {
    ...data, mapLink: "https://maps.example/?x=1&y=2",
  });
  assert.ok(result.includes('href="https://maps.example/?x=1&amp;y=2"'));
});
