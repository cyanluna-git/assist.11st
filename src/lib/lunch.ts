import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  lunchPlaceExclusions,
  lunchRecommendationHistory,
  lunchReviewPhotos,
  lunchReviews,
  lunchVisitEvents,
  lunchVisitStates,
  users,
} from "@/db/schema";
import { getLunchPlaceExternalUrl } from "@/lib/lunch-links";
import { getSeoulDayStart } from "@/lib/seoul-date";
import type {
  LunchErrorCode,
  LunchListResponse,
  LunchPlace,
  LunchRecommendation,
  LunchReviewPhoto,
  LunchReview,
  LunchVisitStatus,
} from "@/types/lunch";

const EWHA_STATION_CENTER = {
  x: 126.946512,
  y: 37.556733,
};

const LUNCH_RADIUS_METERS = 500;
const KAKAO_CATEGORY_FOOD = "FD6";
const KAKAO_PAGE_SIZE = 15;
const KAKAO_MAX_PAGES = 3;
const KAKAO_CACHE_TTL_MS = 1000 * 60 * 5;

let nearbyPlacesCache:
  | {
      expiresAt: number;
      value: LunchListResponse;
    }
  | null = null;

export interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

interface KakaoSearchResponse {
  documents: KakaoPlaceDocument[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

interface KakaoKeywordDocument extends KakaoPlaceDocument {
  category_group_code?: string;
}

export class LunchSourceError extends Error {
  code: LunchErrorCode;
  status: number;
  retryable: boolean;

  constructor(
    code: LunchErrorCode,
    message: string,
    status: number,
    retryable: boolean,
  ) {
    super(message);
    this.name = "LunchSourceError";
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function classifyLunchSourceError(input: {
  status?: number;
  message?: string;
}): LunchSourceError {
  const message = input.message?.trim() || "Kakao Local API request failed";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("accessdeniederror") ||
    normalized.includes("ip mismatched") ||
    normalized.includes("unauthorized")
  ) {
    return new LunchSourceError(
      "kakao_auth",
      "카카오 장소 인증 또는 허용 IP 설정을 확인해야 합니다.",
      502,
      false,
    );
  }

  if (
    input.status === 429 ||
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return new LunchSourceError(
      "kakao_quota",
      "카카오 조회 한도에 도달해 잠시 후 다시 시도해야 합니다.",
      503,
      true,
    );
  }

  if (input.status === 500 || input.status === 502 || input.status === 503) {
    return new LunchSourceError(
      "kakao_network",
      "카카오 장소 조회가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.",
      503,
      true,
    );
  }

  return new LunchSourceError(
    "kakao_unknown",
    "카카오 장소 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.",
    503,
    true,
  );
}

export function serializeLunchError(error: unknown) {
  if (error instanceof LunchSourceError) {
    return {
      error: error.message,
      errorCode: error.code,
      retryable: error.retryable,
      status: error.status,
    };
  }

  return {
    error: error instanceof Error ? error.message : "Lunch source request failed",
    errorCode: "kakao_unknown" as const,
    retryable: true,
    status: 500,
  };
}

function getKakaoRestApiKey() {
  const key = process.env.KAKAO_REST_API?.trim();
  if (!key) {
    throw new LunchSourceError(
      "config_error",
      "KAKAO_REST_API가 설정되지 않았습니다.",
      500,
      false,
    );
  }
  return key;
}

export function normalizeKakaoPlace(place: KakaoPlaceDocument): LunchPlace {
  return {
    id: place.id,
    name: place.place_name,
    categoryName: place.category_name,
    distance: Number(place.distance) || 0,
    roadAddressName: place.road_address_name || null,
    addressName: place.address_name || null,
    phone: place.phone || null,
    x: Number(place.x),
    y: Number(place.y),
    placeUrl: getLunchPlaceExternalUrl({
      id: place.id,
      name: place.place_name,
      x: Number(place.x),
      y: Number(place.y),
      placeUrl: place.place_url || null,
    }),
    heroImageUrl: null,
    visitState: null,
    visitedCount: 0,
    memoCount: 0,
    myReview: null,
  };
}

function mapReviewPhotos(items: Array<{
  id: string;
  reviewId: string;
  imageUrl: string;
  sortOrder: number;
}>): Map<string, LunchReviewPhoto[]> {
  const photoMap = new Map<string, LunchReviewPhoto[]>();

  for (const item of items) {
    const existing = photoMap.get(item.reviewId) ?? [];
    existing.push({
      id: item.id,
      imageUrl: item.imageUrl,
      sortOrder: item.sortOrder,
    });
    photoMap.set(item.reviewId, existing);
  }

  for (const [reviewId, photos] of photoMap) {
    photoMap.set(
      reviewId,
      [...photos].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)),
    );
  }

  return photoMap;
}

export async function fetchNearbyLunchPlaces() {
  if (nearbyPlacesCache && nearbyPlacesCache.expiresAt > Date.now()) {
    return {
      ...nearbyPlacesCache.value,
      places: nearbyPlacesCache.value.places.map((place) => ({ ...place })),
    };
  }

  const docs: KakaoPlaceDocument[] = [];
  let meta: KakaoSearchResponse["meta"] | null = null;
  const apiKey = getKakaoRestApiKey();

  for (let page = 1; page <= KAKAO_MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      category_group_code: KAKAO_CATEGORY_FOOD,
      x: String(EWHA_STATION_CENTER.x),
      y: String(EWHA_STATION_CENTER.y),
      radius: String(LUNCH_RADIUS_METERS),
      sort: "distance",
      page: String(page),
      size: String(KAKAO_PAGE_SIZE),
    });

    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params.toString()}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`,
        },
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw classifyLunchSourceError({
        status: res.status,
        message: text || `Kakao Local API failed with status ${res.status}`,
      });
    }

    let payload: KakaoSearchResponse;
    try {
      payload = (await res.json()) as KakaoSearchResponse;
    } catch {
      throw classifyLunchSourceError({
        status: 502,
        message: "Failed to parse Kakao Local response",
      });
    }

    docs.push(...payload.documents);
    meta = payload.meta;

    if (payload.meta.is_end) {
      break;
    }
  }

  const unique = Array.from(new Map(docs.map((doc) => [doc.id, doc])).values());
  const places = unique
    .map(normalizeKakaoPlace)
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name, "ko-KR"));

  const response = {
    places,
    fetchedAt: new Date().toISOString(),
    sourceMeta: {
      totalCount: meta?.total_count ?? places.length,
      pageableCount: meta?.pageable_count ?? places.length,
      maxReachableCount: KAKAO_PAGE_SIZE * KAKAO_MAX_PAGES,
    },
  };

  nearbyPlacesCache = {
    expiresAt: Date.now() + KAKAO_CACHE_TTL_MS,
    value: response,
  };

  return {
    ...response,
    places: response.places.map((place) => ({ ...place })),
  };
}

export async function getLunchPlaceExclusions() {
  return db
    .select({
      id: lunchPlaceExclusions.id,
      kakaoPlaceId: lunchPlaceExclusions.kakaoPlaceId,
      placeName: lunchPlaceExclusions.placeName,
      categoryName: lunchPlaceExclusions.categoryName,
      roadAddressName: lunchPlaceExclusions.roadAddressName,
      addressName: lunchPlaceExclusions.addressName,
      createdAt: lunchPlaceExclusions.createdAt,
      updatedAt: lunchPlaceExclusions.updatedAt,
    })
    .from(lunchPlaceExclusions)
    .orderBy(lunchPlaceExclusions.placeName);
}

export async function getLunchPlaceExclusionIdSet() {
  const rows = await db
    .select({
      kakaoPlaceId: lunchPlaceExclusions.kakaoPlaceId,
    })
    .from(lunchPlaceExclusions);

  return new Set(rows.map((row) => row.kakaoPlaceId));
}

export function applyLunchPlaceExclusions(
  places: LunchPlace[],
  excludedIds: Iterable<string>,
) {
  const excludedIdSet = excludedIds instanceof Set ? excludedIds : new Set(excludedIds);
  return places.filter((place) => !excludedIdSet.has(place.id));
}

export async function fetchCuratedNearbyLunchPlaces() {
  const [base, excludedIds] = await Promise.all([
    fetchNearbyLunchPlaces(),
    getLunchPlaceExclusionIdSet(),
  ]);

  return {
    ...base,
    places: applyLunchPlaceExclusions(base.places, excludedIds),
  };
}

export async function searchLunchPlacesByKeyword(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    query: trimmed,
    x: String(EWHA_STATION_CENTER.x),
    y: String(EWHA_STATION_CENTER.y),
    radius: String(LUNCH_RADIUS_METERS),
    sort: "distance",
    page: "1",
    size: "15",
  });

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`,
    {
      headers: {
        Authorization: `KakaoAK ${getKakaoRestApiKey()}`,
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw classifyLunchSourceError({
      status: res.status,
      message: text || `Kakao keyword search failed with status ${res.status}`,
    });
  }

  let payload: {
    documents: KakaoKeywordDocument[];
  };
  try {
    payload = (await res.json()) as { documents: KakaoKeywordDocument[] };
  } catch {
    throw classifyLunchSourceError({
      status: 502,
      message: "Failed to parse Kakao keyword search response",
    });
  }

  return payload.documents
    .filter(
      (doc) =>
        doc.category_group_code === "FD6" ||
        doc.category_name?.startsWith("음식점"),
    )
    .map(normalizeKakaoPlace)
    .sort((a, b) => a.distance - b.distance || a.name.localeCompare(b.name, "ko-KR"));
}

export function getLunchCategoryBucket(categoryName: string) {
  const segments = categoryName
    .split(">")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return "기타";
  }

  if (segments[0] === "음식점") {
    return segments[1] ?? segments[segments.length - 1] ?? "기타";
  }

  return segments[0];
}

export function buildRecentLunchCategoryTrail(
  places: LunchPlace[],
  recentIds: string[],
) {
  const placeMap = new Map(places.map((place) => [place.id, place]));
  const categories: string[] = [];

  for (const placeId of recentIds) {
    const place = placeMap.get(placeId);
    if (!place) {
      continue;
    }

    categories.push(getLunchCategoryBucket(place.categoryName));
  }

  return categories;
}

export function buildLunchRecommendationReason(
  place: LunchPlace,
  options?: {
    recentCategories?: string[];
  },
) {
  const fragments: string[] = [];
  const category = getLunchCategoryBucket(place.categoryName);
  const recentCategories = options?.recentCategories ?? [];

  if (place.visitState !== "visited") {
    fragments.push("안 가본 후보를 우선 골랐어요");
  }
  if (recentCategories.length > 0 && !recentCategories.includes(category)) {
    fragments.push(`최근 추천과 다른 ${category} 계열로 골라봤어요`);
  }
  if (place.visitedCount > 0) {
    fragments.push(`원우 ${place.visitedCount}명이 가봤어요`);
  }
  if (place.memoCount > 0) {
    fragments.push(`메모 ${place.memoCount}개가 쌓여 있어요`);
  }
  if (place.distance <= 120) {
    fragments.push(`${place.distance}m 거리라 바로 이동하기 좋아요`);
  }

  return fragments[0]
    ? fragments.join(" · ")
    : `${place.distance}m 거리의 가까운 점심 후보예요`;
}

export function scoreLunchPlace(
  place: LunchPlace,
  recentIds: Set<string>,
  recentCategories: string[] = [],
) {
  let score = 0;
  const category = getLunchCategoryBucket(place.categoryName);
  const repeatedCategoryCount = recentCategories.filter(
    (recentCategory) => recentCategory === category,
  ).length;

  if (place.visitState === null) score += 38;
  if (place.visitState === "visited") score -= 18;

  score += Math.min(place.visitedCount, 8) * 5;
  score += Math.min(place.memoCount, 8) * 2;
  score -= Math.min(place.distance, 500) / 12;

  if (recentIds.has(place.id)) score -= 32;
  if (repeatedCategoryCount > 0) score -= repeatedCategoryCount * 14;
  if (recentCategories[0] === category) score -= 18;
  if (recentCategories.length > 0 && repeatedCategoryCount === 0) score += 10;

  return score;
}

export async function enrichLunchPlacesForUser(
  userId: string,
  base: Awaited<ReturnType<typeof fetchNearbyLunchPlaces>>,
): Promise<LunchListResponse> {
  const placeIds = base.places.map((place) => place.id);
  if (placeIds.length === 0) {
    return base;
  }

  const [visitStates, visitAggregates, memoAggregates, myReviews, representativePhotos] =
    await Promise.all([
    db
      .select({
        kakaoPlaceId: lunchVisitStates.kakaoPlaceId,
        status: lunchVisitStates.status,
      })
      .from(lunchVisitStates)
      .where(
        and(
          eq(lunchVisitStates.userId, userId),
          inArray(lunchVisitStates.kakaoPlaceId, placeIds),
        ),
      ),
    db
      .select({
        kakaoPlaceId: lunchVisitEvents.kakaoPlaceId,
        visitedCount: sql<number>`count(${lunchVisitEvents.id})`,
      })
      .from(lunchVisitEvents)
      .where(
        and(
          inArray(lunchVisitEvents.kakaoPlaceId, placeIds),
        ),
      )
      .groupBy(lunchVisitEvents.kakaoPlaceId),
    db
      .select({
        kakaoPlaceId: lunchReviews.kakaoPlaceId,
        memoCount: sql<number>`count(${lunchReviews.id})`,
      })
      .from(lunchReviews)
      .where(inArray(lunchReviews.kakaoPlaceId, placeIds))
      .groupBy(lunchReviews.kakaoPlaceId),
    db
      .select({
        id: lunchReviews.id,
        kakaoPlaceId: lunchReviews.kakaoPlaceId,
        content: lunchReviews.content,
        updatedAt: lunchReviews.updatedAt,
      })
      .from(lunchReviews)
      .where(
        and(
          eq(lunchReviews.userId, userId),
          inArray(lunchReviews.kakaoPlaceId, placeIds),
        ),
      ),
    db
      .select({
        id: lunchReviewPhotos.id,
        imageUrl: lunchReviewPhotos.imageUrl,
        sortOrder: lunchReviewPhotos.sortOrder,
        kakaoPlaceId: lunchReviews.kakaoPlaceId,
      })
      .from(lunchReviewPhotos)
      .innerJoin(lunchReviews, eq(lunchReviewPhotos.reviewId, lunchReviews.id))
      .where(inArray(lunchReviews.kakaoPlaceId, placeIds))
      .orderBy(desc(lunchReviews.updatedAt), lunchReviewPhotos.sortOrder),
    ]);

  const myReviewPhotos =
    myReviews.length > 0
      ? await db
          .select({
            id: lunchReviewPhotos.id,
            reviewId: lunchReviewPhotos.reviewId,
            imageUrl: lunchReviewPhotos.imageUrl,
            sortOrder: lunchReviewPhotos.sortOrder,
          })
          .from(lunchReviewPhotos)
          .where(inArray(lunchReviewPhotos.reviewId, myReviews.map((item) => item.id)))
      : [];

  const visitMap = new Map(
    visitStates
      .filter((item) => item.status === "visited")
      .map((item) => [item.kakaoPlaceId, "visited" as LunchVisitStatus]),
  );
  const visitAggregateMap = new Map(
    visitAggregates.map((item) => [item.kakaoPlaceId, Number(item.visitedCount) || 0]),
  );
  const aggregateMap = new Map(
    memoAggregates.map((item) => [item.kakaoPlaceId, Number(item.memoCount) || 0]),
  );
  const myReviewPhotoMap = mapReviewPhotos(myReviewPhotos);
  const myReviewMap = new Map(
    myReviews.map((item) => [
      item.kakaoPlaceId,
      {
        id: item.id,
        content: item.content,
        updatedAt: item.updatedAt.toISOString(),
        photos: myReviewPhotoMap.get(item.id) ?? [],
      },
    ]),
  );
  const heroPhotoMap = new Map<string, string>();
  for (const item of representativePhotos) {
    if (!heroPhotoMap.has(item.kakaoPlaceId)) {
      heroPhotoMap.set(item.kakaoPlaceId, item.imageUrl);
    }
  }

  return {
    ...base,
    places: base.places.map((place) => {
      const aggregate = aggregateMap.get(place.id);
      return {
        ...place,
        visitState: visitMap.get(place.id) ?? null,
        visitedCount: visitAggregateMap.get(place.id) ?? 0,
        memoCount: aggregate ?? 0,
        myReview: myReviewMap.get(place.id) ?? null,
        heroImageUrl: heroPhotoMap.get(place.id) ?? null,
      };
    }),
  };
}

export async function getLunchListForUser(userId: string) {
  const base = await fetchCuratedNearbyLunchPlaces();
  return enrichLunchPlacesForUser(userId, base);
}

export function pickLunchRecommendationPlace(
  places: LunchPlace[],
  recentIds: Set<string>,
  recentCategories: string[] = [],
) {
  const ranked = [...places].sort(
    (a, b) =>
      scoreLunchPlace(b, recentIds, recentCategories) -
        scoreLunchPlace(a, recentIds, recentCategories) ||
      a.distance - b.distance ||
      b.visitedCount - a.visitedCount ||
      b.memoCount - a.memoCount,
  );

  return ranked[0] ?? null;
}

export async function getLunchRecommendationForUser(
  userId: string,
): Promise<LunchRecommendation | null> {
  const [lunchData, todayHistory, recentHistory] = await Promise.all([
    getLunchListForUser(userId),
    db
      .select({
        kakaoPlaceId: lunchRecommendationHistory.kakaoPlaceId,
        reason: lunchRecommendationHistory.reason,
        createdAt: lunchRecommendationHistory.createdAt,
      })
      .from(lunchRecommendationHistory)
      .where(
        and(
          eq(lunchRecommendationHistory.userId, userId),
          gte(lunchRecommendationHistory.createdAt, getSeoulDayStart()),
        ),
      )
      .orderBy(desc(lunchRecommendationHistory.createdAt))
      .limit(1),
    db
      .select({
        kakaoPlaceId: lunchRecommendationHistory.kakaoPlaceId,
      })
      .from(lunchRecommendationHistory)
      .where(eq(lunchRecommendationHistory.userId, userId))
      .orderBy(desc(lunchRecommendationHistory.createdAt))
      .limit(5),
  ]);

  if (lunchData.places.length === 0) {
    return null;
  }

  const today = todayHistory[0];
  if (today) {
    const reusedPlace = lunchData.places.find((place) => place.id === today.kakaoPlaceId);
    if (reusedPlace) {
      return {
        place: reusedPlace,
        reason: today.reason || buildLunchRecommendationReason(reusedPlace),
        createdAt: today.createdAt.toISOString(),
        reused: true,
      };
    }
  }

  const recentPlaceIds = recentHistory.map((item) => item.kakaoPlaceId);
  const recentIds = new Set(recentPlaceIds);
  const recentCategories = buildRecentLunchCategoryTrail(
    lunchData.places,
    recentPlaceIds,
  );
  const selected = pickLunchRecommendationPlace(
    lunchData.places,
    recentIds,
    recentCategories,
  );

  if (!selected) {
    return null;
  }

  const reason = buildLunchRecommendationReason(selected, { recentCategories });
  const inserted = await db
    .insert(lunchRecommendationHistory)
    .values({
      userId,
      kakaoPlaceId: selected.id,
      reason,
    })
    .returning({
      createdAt: lunchRecommendationHistory.createdAt,
    });

  return {
    place: selected,
    reason,
    createdAt: inserted[0]?.createdAt.toISOString() ?? new Date().toISOString(),
    reused: false,
  };
}

export async function getLunchReviewsForPlace(
  userId: string,
  placeId: string,
): Promise<LunchReview[]> {
  const reviews = await db
    .select({
      id: lunchReviews.id,
      userId: lunchReviews.userId,
      content: lunchReviews.content,
      createdAt: lunchReviews.createdAt,
      updatedAt: lunchReviews.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(lunchReviews)
    .leftJoin(users, eq(lunchReviews.userId, users.id))
    .where(eq(lunchReviews.kakaoPlaceId, placeId))
    .orderBy(desc(lunchReviews.updatedAt));

  const reviewPhotos =
    reviews.length > 0
      ? await db
          .select({
            id: lunchReviewPhotos.id,
            reviewId: lunchReviewPhotos.reviewId,
            imageUrl: lunchReviewPhotos.imageUrl,
            sortOrder: lunchReviewPhotos.sortOrder,
          })
          .from(lunchReviewPhotos)
          .where(inArray(lunchReviewPhotos.reviewId, reviews.map((review) => review.id)))
      : [];

  const photoMap = mapReviewPhotos(reviewPhotos);

  return reviews.map((review) => ({
    id: review.id,
    userId: review.userId,
    userName: review.userName,
    userAvatar: review.userAvatar,
    content: review.content,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    isMine: review.userId === userId,
    photos: photoMap.get(review.id) ?? [],
  }));
}

export const lunchConfig = {
  center: EWHA_STATION_CENTER,
  radiusMeters: LUNCH_RADIUS_METERS,
};
