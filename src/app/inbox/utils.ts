/** Strip any number of leading "Re:" or "Re: " prefixes (case-insensitive) */
export function stripRePrefix(subject: string): string {
  return subject.replace(/^(Re:\s*)+/i, "").trim();
}

/** Build a "Re: Original Subject" that never double-stacks Re: */
export function buildReplySubject(subject: string): string {
  return `Re: ${stripRePrefix(subject)}`;
}

export const ROLE_FORMAL_PREFIX: Record<string, string> = {
  officer: "Officer",
  faculty: "Faculty",
  admin: "Admin",
  member: "Member",
  non_member: "Student",
};

export interface PersonLike {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  role_code?: string | null;
}

/** Plain "First Last" name for avatars/initials */
export function formatPlainName(
  person?: PersonLike | null,
  fallback = "Chapter Member"
): string {
  if (!person) return fallback;
  const full = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  return full || fallback;
}

/** Formal "Officer: First Last" name */
export function formatFormalName(
  person?: PersonLike | null,
  fallback = "Chapter Member"
): string {
  if (!person) return fallback;
  const full = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  if (!full) return fallback;
  const prefix = person.role_code ? ROLE_FORMAL_PREFIX[person.role_code] : null;
  return prefix ? `${prefix}: ${full}` : full;
}
