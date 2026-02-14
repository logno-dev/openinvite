export type DocsNavItem = {
  title: string;
  href: string;
};

export type DocsNavSection = {
  title: string;
  items: DocsNavItem[];
};

export const docsNav: DocsNavSection[] = [
  {
    title: "Getting started",
    items: [
      { title: "Overview", href: "/docs" },
      { title: "Create an invitation", href: "/docs/getting-started" },
      { title: "Manage guests", href: "/docs/managing-guests" },
      { title: "RSVP options", href: "/docs/rsvp-options" },
      { title: "Send invitations", href: "/docs/sending-invitations" },
    ],
  },
  {
    title: "Templating",
    items: [
      { title: "Template system", href: "/docs/templating" },
    ],
  },
];
