function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeTags(tags: string[]) {
  const seen = new Set<string>();
  return tags
    .map(normalizeTag)
    .filter((tag) => tag.length > 0)
    .filter((tag) => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

export function parseTagsInput(input?: string[] | string | null) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return normalizeTags(input);
  }
  return normalizeTags(input.split(","));
}

export function serializeTags(tags?: string[] | null) {
  const normalized = tags ? normalizeTags(tags) : [];
  return normalized.length > 0 ? normalized.join(", ") : null;
}

export function parseStoredTags(value: string | null) {
  if (!value) return [];
  return normalizeTags(value.split(","));
}
