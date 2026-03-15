export const ORGANIZATION_ROLE_ORDER = [
  "president",
  "vice_president",
  "women_president",
  "treasurer",
] as const;

export type OrganizationRoleKey = (typeof ORGANIZATION_ROLE_ORDER)[number];

export const ORGANIZATION_ROLE_LABELS: Record<OrganizationRoleKey, string> = {
  president: "회장",
  vice_president: "부회장",
  women_president: "여회장",
  treasurer: "총무",
};
