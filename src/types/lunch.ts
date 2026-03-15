export type LunchVisitStatus = "visited";
export type LunchErrorCode =
  | "config_error"
  | "kakao_auth"
  | "kakao_quota"
  | "kakao_network"
  | "kakao_unknown"
  | "visit_daily_limit";

export interface LunchReviewPhoto {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface LunchReviewSummary {
  id: string;
  content: string;
  updatedAt: string;
  photos: LunchReviewPhoto[];
}

export interface LunchPlace {
  id: string;
  name: string;
  categoryName: string;
  distance: number;
  roadAddressName: string | null;
  addressName: string | null;
  phone: string | null;
  x: number;
  y: number;
  placeUrl: string | null;
  heroImageUrl: string | null;
  visitState: LunchVisitStatus | null;
  visitedCount: number;
  memoCount: number;
  myReview: LunchReviewSummary | null;
}

export interface LunchReview {
  id: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
  photos: LunchReviewPhoto[];
}

export interface LunchListResponse {
  places: LunchPlace[];
  fetchedAt: string;
  sourceMeta: {
    totalCount: number;
    pageableCount: number;
    maxReachableCount: number;
  };
}

export interface LunchRecommendation {
  place: LunchPlace;
  reason: string;
  createdAt: string;
  reused: boolean;
}

export interface LunchPlaceExclusion {
  id: string;
  kakaoPlaceId: string;
  placeName: string;
  categoryName: string | null;
  roadAddressName: string | null;
  addressName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BabzipData {
  candidates: LunchPlace[];
  exclusions: LunchPlaceExclusion[];
}
