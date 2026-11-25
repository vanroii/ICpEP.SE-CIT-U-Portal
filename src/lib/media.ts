/**
 * Parse `cover_image_url` which may be either a single URL/data-URL string
 * or a JSON-encoded array of URLs for multi-photo carousel posts.
 */
export function parseMediaUrls(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      // Fallback to treating as single URL string
    }
  }

  return [trimmed];
}

/**
 * Serialize 0, 1, or N media URLs into `cover_image_url` format.
 * Single image stays a plain string for full backward compatibility.
 */
export function serializeMediaUrls(urls: string[]): string {
  const cleaned = urls.map((u) => u.trim()).filter(Boolean);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}
