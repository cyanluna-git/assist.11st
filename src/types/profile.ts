export interface CareerEntry {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  current: boolean;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  industry: string | null;
  interests: string | null;
  bio: string | null;
  github: string | null;
  portfolio: string | null;
  linkedin: string | null;
  careers: CareerEntry[] | null;
  avatarUrl: string | null;
  role: "admin" | "member" | "professor";
}

export interface ProfileDetail extends Profile {
  createdAt: string;
}

export interface ProfileUpdatePayload {
  phone?: string;
  company?: string;
  position?: string;
  industry?: string;
  interests?: string;
  bio?: string;
  avatarUrl?: string;
  github?: string;
  portfolio?: string;
  linkedin?: string;
  careers?: CareerEntry[];
}
