export type GroupCategory = "study" | "hobby" | "business" | "social" | "other";

export const GROUP_CATEGORIES = [
  { value: "study" as GroupCategory, label: "스터디", color: "text-blue-600", bg: "bg-blue-50" },
  { value: "hobby" as GroupCategory, label: "취미", color: "text-green-600", bg: "bg-green-50" },
  { value: "business" as GroupCategory, label: "비즈니스", color: "text-amber-600", bg: "bg-amber-50" },
  { value: "social" as GroupCategory, label: "친목", color: "text-pink-600", bg: "bg-pink-50" },
  { value: "other" as GroupCategory, label: "기타", color: "text-gray-600", bg: "bg-gray-50" },
] as const;

export const GROUP_CATEGORY_MAP = Object.fromEntries(
  GROUP_CATEGORIES.map((c) => [c.value, c]),
) as Record<GroupCategory, (typeof GROUP_CATEGORIES)[number]>;

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  leaderId: string;
  leaderName: string | null;
  leaderAvatar: string | null;
  maxMembers: number | null;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
}

export type GroupDetail = GroupSummary;

export interface GroupMember {
  id: string;
  userId: string;
  joinedAt: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  company: string | null;
  position: string | null;
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: string;
  authorName: string | null;
  authorAvatar: string | null;
}
