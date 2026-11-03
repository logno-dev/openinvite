const absoluteUrlPattern = /^[a-z][a-z0-9+.-]*:/i;

export function resolveTemplateAssetUrl(value: string, templateUrl: string): string {
  const url = value.trim();
  if (!url || url.startsWith("#") || absoluteUrlPattern.test(url)) return value;

  try {
    const base = new URL(templateUrl);
    if (base.protocol !== "http:" && base.protocol !== "https:") return value;
    return new URL(url, base).href;
  } catch {
    return value;
  }
}

export function resolveTemplateSrcset(value: string, templateUrl: string): string {
  return value
    .split(",")
    .map((candidate) => {
      const match = candidate.trim().match(/^(\S+)(\s+.+)?$/);
      if (!match) return candidate.trim();
      return `${resolveTemplateAssetUrl(match[1], templateUrl)}${match[2] ?? ""}`;
    })
    .join(", ");
}

export function resolveTemplateCssUrls(css: string, templateUrl: string): string {
  return css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (match, quote: string, url: string) => {
    const resolved = resolveTemplateAssetUrl(url, templateUrl);
    return resolved === url ? match : `url(${quote}${resolved}${quote})`;
  });
}

export function resolveTemplateDocumentAssets(doc: Document, templateUrl: string): void {
  for (const image of doc.querySelectorAll<HTMLImageElement>("img[src]")) {
    image.setAttribute("src", resolveTemplateAssetUrl(image.getAttribute("src") ?? "", templateUrl));
  }
  for (const image of doc.querySelectorAll<HTMLImageElement>("img[srcset]")) {
    image.setAttribute("srcset", resolveTemplateSrcset(image.getAttribute("srcset") ?? "", templateUrl));
  }
  for (const link of doc.querySelectorAll<HTMLLinkElement>("link[href]")) {
    link.setAttribute("href", resolveTemplateAssetUrl(link.getAttribute("href") ?? "", templateUrl));
  }
  for (const element of doc.querySelectorAll<HTMLElement>("[style]")) {
    element.setAttribute("style", resolveTemplateCssUrls(element.getAttribute("style") ?? "", templateUrl));
  }
  for (const style of doc.querySelectorAll<HTMLStyleElement>("style")) {
    style.textContent = resolveTemplateCssUrls(style.textContent ?? "", templateUrl);
  }
}
