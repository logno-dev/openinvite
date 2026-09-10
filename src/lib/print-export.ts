import { toCanvas } from "html-to-image";
import QRCode from "qrcode";
import { applyPreviewDataToHtml, type PreviewPayload } from "@/lib/preview-template";
import { PRINT_HEIGHT, PRINT_WIDTH, setPngPrintResolution } from "@/lib/print-png";
import { removePrintExtras } from "@/lib/print-layout";
import { getPrintFontEmbedCSS } from "@/lib/print-fonts";

const LAYOUT_WIDTH = 480;
const LAYOUT_HEIGHT = 672;

async function withAssetTimeout<T>(promise: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Template assets took too long to render. Check the image and font URLs and try again.")), 30000);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function renderPrintTemplate(
  html: string,
  payload: PreviewPayload,
  templateUrl: string,
  publicUrl: string
): Promise<string> {
  const source = new DOMParser().parseFromString(html, "text/html");
  removePrintExtras(source);
  const doc = new DOMParser().parseFromString(applyPreviewDataToHtml(source.documentElement.outerHTML, payload, "print"), "text/html");
  doc.documentElement.classList.add("oi-print");
  doc.querySelectorAll("script, base, meta[http-equiv], iframe, object, embed, #calendar_link").forEach((node) => node.remove());
  for (const element of doc.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on")) element.removeAttribute(attribute.name);
    }
  }
  const base = doc.createElement("base");
  base.href = templateUrl;
  doc.head.prepend(base);
  // Request readable CSSOM rules from the start; setting this after load is too late.
  for (const link of doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')) {
    link.crossOrigin = "anonymous";
  }
  for (const image of doc.images) {
    image.loading = "eager";
    image.crossOrigin = "anonymous";
  }

  const qr = doc.createElement("div");
  qr.id = "oi-print-qr";
  const image = doc.createElement("img");
  image.src = await QRCode.toDataURL(publicUrl, { errorCorrectionLevel: "M", margin: 4, width: 660, color: { dark: "#000000", light: "#ffffff" } });
  image.alt = "Scan to open the digital invitation";
  qr.append(image);
  const caption = doc.createElement("span");
  caption.textContent = "Scan for invitation & RSVP";
  qr.append(caption);

  const response = doc.getElementById("response");
  if (response) response.replaceChildren(qr);
  else (doc.querySelector("main") ?? doc.body).append(qr);
  // Interactive content has no useful representation on a printed invitation.
  doc.querySelectorAll("form, button, input, select, textarea, video, audio").forEach((node) => node.remove());
  if (!doc.contains(qr)) (doc.querySelector("main") ?? doc.body).append(qr);
  const style = doc.createElement("style");
  style.textContent = `
    :where(html.oi-print) {
      --oi-print-width: ${LAYOUT_WIDTH}px;
      --oi-print-height: ${LAYOUT_HEIGHT}px;
      --oi-print-qr-size: 112px;
      --oi-print-qr-padding: 8px;
      --oi-print-qr-margin: 0 auto;
      scrollbar-width: none;
    }
    #oi-print-qr {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      box-sizing: border-box; padding: var(--oi-print-qr-padding);
      background: #fff; color: #111; border-radius: 8px;
      width: fit-content; max-width: 100%; margin: var(--oi-print-qr-margin);
      break-inside: avoid;
    }
    #oi-print-qr img {
      display: block; width: var(--oi-print-qr-size); height: var(--oi-print-qr-size);
      max-width: none; margin: 0; object-fit: contain;
    }
    #oi-print-qr span {
      font: 12px/1.4 Arial, sans-serif; letter-spacing: 0; text-transform: none;
      text-align: center; color: #111;
    }
    *, *::before, *::after {
      animation: none !important; transition: none !important; caret-color: transparent !important;
    }
  `;
  doc.head.append(style);
  return "<!doctype html>" + doc.documentElement.outerHTML;
}

export async function exportPrintPng(html: string): Promise<Blob> {
  const frame = document.createElement("iframe");
  frame.title = "Print rendering";
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${LAYOUT_WIDTH}px;height:${LAYOUT_HEIGHT}px;border:0;pointer-events:none;`;
  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Template assets took too long to load. Check the template's image and font URLs.")), 20000);
      frame.onload = () => { clearTimeout(timeout); resolve(); };
      frame.srcdoc = html;
      document.body.append(frame);
    });
    const doc = frame.contentDocument;
    if (!doc || !frame.contentWindow) throw new Error("Print renderer could not load.");
    for (const link of doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')) {
      if (link.disabled || (link.media && !frame.contentWindow.matchMedia(link.media).matches)) continue;
      try {
        if (!link.sheet) throw new Error("Stylesheet did not load");
        // Detect blocked styles before html-to-image attempts to embed font rules.
        void link.sheet.cssRules;
      } catch {
        throw new Error(`A template stylesheet could not be loaded or read: ${link.href}. Check its URL and configure its server to allow CORS from ${window.location.origin}.`);
      }
    }
    await withAssetTimeout(doc.fonts.ready);
    await withAssetTimeout(Promise.all([...doc.images].map((image) => image.decode().catch(() => {
      throw new Error("An image could not be loaded. Check its URL and enable CORS on the asset server.");
    }))));

    const width = Math.max(LAYOUT_WIDTH, doc.documentElement.scrollWidth, doc.body.scrollWidth);
    const height = Math.max(LAYOUT_HEIGHT, doc.documentElement.scrollHeight, doc.body.scrollHeight);
    const scale = Math.min(PRINT_WIDTH / width, PRINT_HEIGHT / height);
    const qr = doc.querySelector<HTMLImageElement>("#oi-print-qr img");
    if (!qr) throw new Error("The print QR code is missing.");
    if (Math.min(qr.getBoundingClientRect().width, qr.getBoundingClientRect().height) * scale < 300 || width > 4000 || height > 6000) {
      throw new Error("This template needs a 5 x 7 print layout. Add html.oi-print CSS for a 480 x 672px card and reserve room for #response. See the 5 x 7 template guide below.");
    }
    const fontEmbedCSS = await withAssetTimeout(getPrintFontEmbedCSS(doc));
    const rendered = await withAssetTimeout(toCanvas(doc.documentElement, {
      width, height, pixelRatio: scale, preferredFontFormat: "woff2", fontEmbedCSS,
    }));
    const canvas = document.createElement("canvas");
    canvas.width = PRINT_WIDTH;
    canvas.height = PRINT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not create the print image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, PRINT_WIDTH, PRINT_HEIGHT);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);
    context.drawImage(rendered, Math.round((PRINT_WIDTH - targetWidth) / 2), Math.round((PRINT_HEIGHT - targetHeight) / 2), targetWidth, targetHeight);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (value) => value ? resolve(value) : reject(new Error("PNG export failed.")), "image/png"
    ));
    const bytes = setPngPrintResolution(new Uint8Array(await blob.arrayBuffer()));
    return new Blob([bytes], { type: "image/png" });
  } finally {
    frame.remove();
  }
}
