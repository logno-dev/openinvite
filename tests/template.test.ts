import assert from "node:assert/strict";
import { test } from "node:test";
import { injectTemplateData, type InvitationTemplateData } from "../src/lib/template";

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
