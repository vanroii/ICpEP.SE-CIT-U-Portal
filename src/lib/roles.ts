export type RoleCode = "non_member" | "member" | "officer" | "faculty" | "admin";

export interface RoleInfo {
  code: RoleCode;
  name: string;
  description: string;
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  non_member: "Non-Member Student",
  member: "ICpEP Member",
  officer: "ICpEP Officer",
  faculty: "Faculty / Adviser",
  admin: "System Administrator",
};

/** Home dashboard per role (FR-05). Non-member and member share the student UI. */
export const DASHBOARD_BY_ROLE: Record<RoleCode, string> = {
  non_member: "/student",
  member: "/student",
  officer: "/officer",
  faculty: "/faculty",
  admin: "/admin",
};

/** Which roles may enter each protected area (BR-04, BR-07, BR-08, BR-09). */
export const AREA_ACCESS: Record<string, RoleCode[]> = {
  "/student": ["non_member", "member"],
  "/officer": ["officer", "admin"],
  "/faculty": ["faculty", "admin"],
  "/admin": ["admin"],
  "/inbox": ["non_member", "member", "officer", "faculty"],
  "/notifications": ["non_member", "member", "officer", "faculty", "admin"],
  "/profile": ["non_member", "member", "officer", "faculty", "admin"],
};
