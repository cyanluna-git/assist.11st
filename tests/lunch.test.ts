import assert from "node:assert/strict";
import test from "node:test";
import {
  applyLunchPlaceExclusions,
  buildLunchRecommendationReason,
  buildRecentLunchCategoryTrail,
  classifyLunchSourceError,
  getLunchCategoryBucket,
  normalizeKakaoPlace,
  pickLunchRecommendationPlace,
  scoreLunchPlace,
  type KakaoPlaceDocument,
} from "@/lib/lunch";
import {
  canManageLunchReview,
  validateLunchReviewInput,
  validateLunchVisitInput,
} from "@/lib/lunch-validation";
import type { LunchPlace } from "@/types/lunch";

function createPlace(overrides: Partial<LunchPlace> = {}): LunchPlace {
  return {
    id: "place-1",
    name: "테스트 식당",
    categoryName: "음식점 > 한식",
    distance: 80,
    roadAddressName: "서울 서대문구 테스트로 1",
    addressName: "서울 서대문구 테스트동 1",
    phone: "02-0000-0000",
    x: 126.9,
    y: 37.5,
    placeUrl: "https://place.map.kakao.com/1",
    heroImageUrl: null,
    visitState: null,
    visitedCount: 0,
    memoCount: 0,
    myReview: null,
    ...overrides,
  };
}

test("normalizeKakaoPlace converts Kakao document fields into app format", () => {
  const doc: KakaoPlaceDocument = {
    id: "123",
    place_name: "이화로뼈구이",
    category_name: "음식점 > 한식 > 육류,고기",
    phone: "02-111-2222",
    address_name: "서울 서대문구 대현동 1",
    road_address_name: "서울 서대문구 신촌역로 1",
    x: "126.946512",
    y: "37.556733",
    place_url: "https://place.map.kakao.com/123",
    distance: "21",
  };

  const place = normalizeKakaoPlace(doc);
  assert.equal(place.id, "123");
  assert.equal(place.name, "이화로뼈구이");
  assert.equal(place.distance, 21);
  assert.equal(place.x, 126.946512);
  assert.equal(place.y, 37.556733);
  assert.equal(place.memoCount, 0);
});

test("applyLunchPlaceExclusions removes excluded Kakao place ids only", () => {
  const filtered = applyLunchPlaceExclusions(
    [
      createPlace({ id: "keep-1" }),
      createPlace({ id: "drop-1" }),
      createPlace({ id: "keep-2" }),
    ],
    ["drop-1", "missing"],
  );

  assert.deepEqual(
    filtered.map((place) => place.id),
    ["keep-1", "keep-2"],
  );
});

test("scoreLunchPlace favors unvisited places and penalizes recent repeats", () => {
  const unvisited = createPlace({
    id: "new",
    visitedCount: 3,
    memoCount: 2,
  });
  const visited = createPlace({
    id: "old",
    visitState: "visited",
    visitedCount: 3,
    memoCount: 2,
  });

  assert.ok(scoreLunchPlace(unvisited, new Set()) > scoreLunchPlace(visited, new Set()));
  assert.ok(scoreLunchPlace(unvisited, new Set(["new"])) < scoreLunchPlace(unvisited, new Set()));
});

test("category helpers normalize buckets and preserve recent recommendation order", () => {
  const places = [
    createPlace({
      id: "korean",
      categoryName: "음식점 > 한식 > 육류,고기",
    }),
    createPlace({
      id: "japanese",
      categoryName: "음식점 > 일식 > 초밥,롤",
    }),
  ];

  assert.equal(getLunchCategoryBucket("음식점 > 한식 > 육류,고기"), "한식");
  assert.deepEqual(buildRecentLunchCategoryTrail(places, ["japanese", "missing", "korean"]), [
    "일식",
    "한식",
  ]);
});

test("scoreLunchPlace rewards category rotation when recent picks repeat", () => {
  const repeatedCategory = createPlace({
    id: "korean-today",
    categoryName: "음식점 > 한식 > 찌개,전골",
    memoCount: 1,
  });
  const rotatedCategory = createPlace({
    id: "japanese-today",
    categoryName: "음식점 > 일식 > 돈까스,우동",
    memoCount: 1,
  });
  const recentCategories = ["한식", "한식", "중식"];

  assert.ok(
    scoreLunchPlace(rotatedCategory, new Set(), recentCategories) >
      scoreLunchPlace(repeatedCategory, new Set(), recentCategories),
  );
});

test("pickLunchRecommendationPlace selects the highest ranked place", () => {
  const picked = pickLunchRecommendationPlace(
    [
      createPlace({
        id: "near-but-visited",
        distance: 50,
        visitState: "visited",
      }),
      createPlace({
        id: "high-score",
        distance: 120,
        visitedCount: 5,
        memoCount: 3,
      }),
    ],
    new Set<string>(),
  );

  assert.equal(picked?.id, "high-score");
});

test("pickLunchRecommendationPlace avoids the same category when alternatives are strong", () => {
  const picked = pickLunchRecommendationPlace(
    [
      createPlace({
        id: "repeat-korean",
        categoryName: "음식점 > 한식 > 국밥",
        visitedCount: 5,
        memoCount: 3,
        distance: 80,
      }),
      createPlace({
        id: "rotate-japanese",
        categoryName: "음식점 > 일식 > 덮밥",
        visitedCount: 4,
        memoCount: 2,
        distance: 95,
      }),
    ],
    new Set<string>(),
    ["한식", "한식", "중식"],
  );

  assert.equal(picked?.id, "rotate-japanese");
});

test("buildLunchRecommendationReason explains why a place was selected", () => {
  const reason = buildLunchRecommendationReason(
    createPlace({
      categoryName: "음식점 > 일식 > 덮밥",
      visitedCount: 4,
      memoCount: 2,
      distance: 95,
    }),
    {
      recentCategories: ["한식", "중식"],
    },
  );

  assert.match(reason, /안 가본 후보/);
  assert.match(reason, /다른 .* 계열/);
  assert.match(reason, /원우 4명/);
  assert.match(reason, /메모 2개/);
  assert.match(reason, /95m 거리/);
});

test("classifyLunchSourceError maps auth and quota failures", () => {
  assert.equal(
    classifyLunchSourceError({ message: "AccessDeniedError ip mismatched" }).code,
    "kakao_auth",
  );
  assert.equal(
    classifyLunchSourceError({ status: 429, message: "too many requests" }).code,
    "kakao_quota",
  );
});

test("validateLunchVisitInput accepts only the allowed visit states", () => {
  assert.deepEqual(validateLunchVisitInput({ placeId: "abc", status: "visited" }), {
    ok: true,
    placeId: "abc",
    status: "visited",
  });
  assert.deepEqual(validateLunchVisitInput({ placeId: "abc", status: "later" }), {
    ok: false,
    error: "Invalid visit status",
  });
});

test("validateLunchReviewInput trims content and validates photos", () => {
  assert.deepEqual(
    validateLunchReviewInput({
      placeId: "abc",
      content: "  혼밥하기 편함  ",
      photoUrls: ["https://example.com/photo-1.jpg"],
    }),
    {
      ok: true,
      placeId: "abc",
      content: "혼밥하기 편함",
      photoUrls: ["https://example.com/photo-1.jpg"],
    },
  );

  assert.deepEqual(
    validateLunchReviewInput({
      placeId: "abc",
      content: "   ",
    }),
    {
      ok: false,
      error: "content is required",
    },
  );

  assert.deepEqual(
    validateLunchReviewInput({
      placeId: "abc",
      content: "photo test",
      photoUrls: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
      ],
    }),
    {
      ok: false,
      error: "photoUrls must contain at most 3 images",
    },
  );
});

test("canManageLunchReview allows owner or admin only", () => {
  assert.equal(
    canManageLunchReview({
      reviewUserId: "u1",
      sessionUserId: "u1",
      sessionRole: "member",
    }),
    true,
  );
  assert.equal(
    canManageLunchReview({
      reviewUserId: "u1",
      sessionUserId: "u2",
      sessionRole: "admin",
    }),
    true,
  );
  assert.equal(
    canManageLunchReview({
      reviewUserId: "u1",
      sessionUserId: "u2",
      sessionRole: "member",
    }),
    false,
  );
});
