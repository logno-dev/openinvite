const extras = "#notes, #notes_2, #notes_3, #registry_link, #map_link, #calendar_link, #guest_message, #guest_name, #expected_adults, #expected_kids, #expected_total, #rsvp_yes_label, #rsvp_no_label, #rsvp_maybe_label";

/** Keep the template structure intact; authors explicitly mark optional wrappers. */
export function removePrintExtras(doc: Document): void {
  doc.querySelectorAll(`${extras}, .oi-print-hide`).forEach((element) => element.remove());
}
