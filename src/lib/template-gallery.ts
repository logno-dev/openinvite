export type TemplateGalleryItem = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string | null;
  repoUrl?: string | null;
};

export const defaultTemplateGallery: TemplateGalleryItem[] = [
  {
    id: "studio-minimal",
    name: "Studio Minimal",
    url: "/templates/studio-minimal.html",
    thumbnailUrl: "/templates/thumbs/studio-minimal.svg",
    repoUrl: null,
  },
  {
    id: "candlelight-modern",
    name: "Candlelight Modern",
    url: "/templates/candlelight-modern.html",
    thumbnailUrl: "/templates/thumbs/candlelight-modern.svg",
    repoUrl: null,
  },
  {
    id: "garden-party",
    name: "Garden Party",
    url: "/templates/garden-party.html",
    thumbnailUrl: "/templates/thumbs/garden-party.svg",
    repoUrl: null,
  },
];
