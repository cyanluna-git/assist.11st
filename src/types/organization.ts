import type { OrganizationRoleKey } from "@/lib/organization";

export interface OrganizationRole {
  id: string | null;
  roleKey: OrganizationRoleKey;
  title: string;
  memberName: string | null;
  photoUrl: string | null;
  updatedAt: string | null;
}

export interface BylawVersion {
  id: string;
  version: string;
  content: string;
  createdAt: string;
  createdByName: string | null;
}

export interface OrganizationData {
  roles: OrganizationRole[];
  currentBylaw: BylawVersion | null;
  bylawHistory: BylawVersion[];
}
