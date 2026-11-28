/** Strip any number of leading "Re:" or "Fwd:" prefixes */
export function stripPrefixes(subject: string): string {
  return subject.replace(/^((Re|Fwd|Fw):\s*)+/i, "").trim();
}

export function buildReplySubject(subject: string): string {
  return `Re: ${stripPrefixes(subject)}`;
}

export function buildForwardSubject(subject: string): string {
  return `Fwd: ${stripPrefixes(subject)}`;
}

export const ROLE_LABEL: Record<string, string> = {
  officer:    "Officer",
  faculty:    "Faculty",
  admin:      "Admin",
  member:     "Member",
  non_member: "Student",
};

export function formatSenderName(person?: any | null, fallback = "Chapter Member"): string {
  if (!person) return fallback;
  const full = `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim();
  if (!full) return fallback;
  const prefix = person.role_code ? ROLE_LABEL[person.role_code] : null;
  return prefix ? `${prefix}: ${full}` : full;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

