export const PRINT_WIDTH = 1500;
export const PRINT_HEIGHT = 2100;
export const PRINT_DPI = 300;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Set PNG physical dimensions so print software recognizes the 5 x 7-inch size. */
export function setPngPrintResolution(png: Uint8Array): Uint8Array<ArrayBuffer> {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!signature.every((byte, index) => png[index] === byte)) {
    throw new Error("Invalid PNG image");
  }
  const chunk = new Uint8Array(21);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  const pixelsPerMeter = Math.round(PRINT_DPI / 0.0254);
  view.setUint32(8, pixelsPerMeter);
  view.setUint32(12, pixelsPerMeter);
  chunk[16] = 1; // Unit: meters.
  view.setUint32(17, crc32(chunk.subarray(4, 17)));

  const parts: Uint8Array[] = [png.slice(0, 8)];
  const source = new DataView(png.buffer, png.byteOffset, png.byteLength);
  let inserted = false;
  for (let offset = 8; offset < png.length;) {
    if (offset + 12 > png.length) throw new Error("Invalid PNG chunk");
    const length = source.getUint32(offset);
    const end = offset + length + 12;
    if (end > png.length) throw new Error("Invalid PNG chunk");
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    if (type !== "pHYs") parts.push(png.slice(offset, end));
    if (type === "IHDR") {
      parts.push(chunk);
      inserted = true;
    }
    offset = end;
  }
  if (!inserted) throw new Error("Missing PNG header");
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
