import { getFontEmbedCSS } from "html-to-image";

/** Discover fonts in the live iframe, before html-to-image clones its document. */
export async function getPrintFontEmbedCSS(doc: Document): Promise<string> {
  const view = doc.defaultView;
  if (!view) throw new Error("Print renderer could not read template fonts.");

  const families = new Set<string>();
  for (const element of doc.querySelectorAll("*")) {
    const style = view.getComputedStyle(element);
    if (style.fontFamily) families.add(style.fontFamily);
    for (const pseudo of ["::before", "::after"]) {
      const pseudoStyle = view.getComputedStyle(element, pseudo);
      if (pseudoStyle.content && pseudoStyle.content !== "none" && pseudoStyle.content !== "normal" && pseudoStyle.fontFamily) {
        families.add(pseudoStyle.fontFamily);
      }
    }
  }

  // The library's `instanceof HTMLElement` traversal skips iframe descendants.
  // A detached probe exposes all used families on one node while retaining the
  // live document's readable stylesheets. Never change the invitation's styles.
  const probe = doc.createElement("div");
  probe.style.fontFamily = [...families].join(", ");
  return getFontEmbedCSS(probe, { preferredFontFormat: "woff2" });
}
