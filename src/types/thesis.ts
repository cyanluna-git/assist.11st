export type ThesisStatus = "draft" | "submitted" | "reviewed";

export const THESIS_STATUSES: {
  value: ThesisStatus;
  label: string;
  color: string;
  bg: string;
}[] = [
  { value: "draft", label: "초안", color: "text-gray-700", bg: "bg-gray-100" },
  {
    value: "submitted",
    label: "제출",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  {
    value: "reviewed",
    label: "리뷰완료",
    color: "text-green-700",
    bg: "bg-green-100",
  },
];

export const STATUS_MAP = Object.fromEntries(
  THESIS_STATUSES.map((s) => [s.value, s]),
) as Record<ThesisStatus, (typeof THESIS_STATUSES)[number]>;

export const THESIS_FIELDS: {
  value: string;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "management",
    label: "경영",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  {
    value: "finance",
    label: "재무",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  {
    value: "marketing",
    label: "마케팅",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  {
    value: "strategy",
    label: "전략",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  { value: "hr", label: "인사", color: "text-pink-700", bg: "bg-pink-100" },
  { value: "it", label: "IT", color: "text-cyan-700", bg: "bg-cyan-100" },
  {
    value: "other",
    label: "기타",
    color: "text-gray-700",
    bg: "bg-gray-100",
  },
];

export const FIELD_MAP = Object.fromEntries(
  THESIS_FIELDS.map((f) => [f.value, f]),
) as Record<string, (typeof THESIS_FIELDS)[number]>;

export interface ThesisSummary {
  id: string;
  title: string;
  abstract: string | null;
  field: string | null;
  status: ThesisStatus;
  fileUrl: string | null;
  authorId: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  };
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ThesisDetail extends ThesisSummary {
  updatedAt: string;
}

export interface ThesisReview {
  id: string;
  thesisId: string;
  rating: number | null;
  feedback: string | null;
  isAnonymous: boolean;
  reviewer: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  createdAt: string;
}
