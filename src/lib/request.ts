export async function readStringFields<K extends string>(
  request: Request,
  fields: readonly K[]
): Promise<Partial<Record<K, string>> | null> {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const values = body as Record<string, unknown>;
  const result: Partial<Record<K, string>> = {};
  for (const field of fields) {
    const value = values[field];
    if (value === undefined) continue;
    if (typeof value !== "string") return null;
    result[field] = value;
  }
  return result;
}
