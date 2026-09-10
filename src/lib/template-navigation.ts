/** Remove author-controlled navigation before inserting invitation-owned links. */
export function stripTemplateNavigation(doc: Document): void {
  doc.querySelectorAll("base, meta[http-equiv], iframe, object, embed, script, foreignObject, foreignobject, animate, animateMotion, animatemotion, animateTransform, animatetransform, set")
    .forEach((element) => element.remove());

  for (const anchor of doc.querySelectorAll("a, area")) {
    for (const name of ["href", "xlink:href", "target", "ping", "download"]) {
      anchor.removeAttribute(name);
    }
  }
  // Templates cannot submit their own forms or use scripts to recreate links.
  for (const form of doc.querySelectorAll("form")) {
    form.replaceWith(...form.childNodes);
  }
  for (const element of doc.querySelectorAll("*")) {
    for (const attribute of [...element.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on") || ["formaction", "formtarget", "form"].includes(attribute.name.toLowerCase())) {
        element.removeAttribute(attribute.name);
      }
    }
  }
}
