import assert from "node:assert/strict";
import { test } from "node:test";
import { PRINT_DPI, PRINT_HEIGHT, PRINT_WIDTH, setPngPrintResolution } from "../src/lib/print-png";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9n8AAAAASUVORK5CYII=", "base64");

function chunks(bytes: Uint8Array) {
  const result: Array<{ type: string; bytes: Uint8Array }> = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 8; offset < bytes.length;) {
    const end = offset + view.getUint32(offset) + 12;
    result.push({ type: String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)), bytes: new Uint8Array(bytes.slice(offset, end)) });
    offset = end;
  }
  return result;
}

test("print export uses 5 by 7 inches at 300 DPI", () => {
  assert.equal(PRINT_WIDTH / PRINT_DPI, 5);
  assert.equal(PRINT_HEIGHT / PRINT_DPI, 7);
  const output = chunks(setPngPrintResolution(png));
  const physical = output.find((chunk) => chunk.type === "pHYs")!;
  assert.equal(output[1].type, "pHYs");
  const view = new DataView(physical.bytes.buffer);
  assert.equal(view.getUint32(8), 11811);
  assert.equal(view.getUint32(12), 11811);
  assert.equal(physical.bytes[16], 1);
  // Known CRC for a pHYs chunk containing 11811 x 11811 pixels per meter.
  assert.equal(view.getUint32(17), 0x78a53f76);
  assert.deepEqual(output.filter((chunk) => chunk.type !== "pHYs"), chunks(png));
});

test("print density replaces existing density rather than adding duplicate chunks", () => {
  const first = setPngPrintResolution(png);
  assert.deepEqual(setPngPrintResolution(first), first);
});

test("invalid PNG data is rejected", () => {
  assert.throws(() => setPngPrintResolution(new Uint8Array([1, 2, 3])), /Invalid PNG/);
  assert.throws(() => setPngPrintResolution(png.subarray(0, 15)), /Invalid PNG chunk/);
});
