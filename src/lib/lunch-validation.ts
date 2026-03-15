import type { LunchVisitStatus } from "@/types/lunch";

export function isLunchVisitStatus(value: unknown): value is LunchVisitStatus {
  return value === "visited";
}

export function validateLunchVisitInput(input: {
  placeId?: string | null;
  status?: unknown;
}) {
  const placeId = input.placeId?.trim();
  if (!placeId) {
    return { ok: false as const, error: "placeId is required" };
  }
  if (!isLunchVisitStatus(input.status)) {
    return { ok: false as const, error: "Invalid visit status" };
  }

  return {
    ok: true as const,
    placeId,
    status: input.status,
  };
}

export function validateLunchReviewInput(input: {
  placeId?: string | null;
  content?: string | null;
  photoUrls?: unknown;
}) {
  const placeId = input.placeId?.trim();
  const content = input.content?.trim();
  const photoUrlsRaw = Array.isArray(input.photoUrls) ? input.photoUrls : [];
  const photoUrls = photoUrlsRaw
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (!placeId) {
    return { ok: false as const, error: "placeId is required" };
  }
  if (!content) {
    return { ok: false as const, error: "content is required" };
  }
  if (photoUrls.length > 3) {
    return { ok: false as const, error: "photoUrls must contain at most 3 images" };
  }
  if (photoUrls.some((url) => !/^https?:\/\//.test(url))) {
    return { ok: false as const, error: "photoUrls must contain valid URLs" };
  }

  return {
    ok: true as const,
    placeId,
    content,
    photoUrls,
  };
}

export function canManageLunchReview(input: {
  reviewUserId: string;
  sessionUserId: string;
  sessionRole: string;
}) {
  return input.reviewUserId === input.sessionUserId || input.sessionRole === "admin";
}
