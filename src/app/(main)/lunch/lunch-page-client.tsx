"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  ImagePlus,
  Loader2,
  MapPin,
  MessageSquareText,
  RefreshCcw,
  Search,
  Sparkles,
  Store,
  TriangleAlert,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  LunchApiError,
  useCreateLunchReview,
  useDeleteLunchReview,
  useLunchPlaces,
  useLunchRecommendation,
  useLunchReviews,
  useSaveLunchVisitState,
  useUpdateLunchReview,
  useUploadLunchReviewImage,
} from "@/hooks/use-lunch";
import { getLunchPlaceExternalUrl } from "@/lib/lunch-links";
import { cn } from "@/lib/utils";
import type { LunchPlace, LunchReviewPhoto } from "@/types/lunch";
import { KakaoMap } from "./kakao-map";

type VisitFilter = "all" | "visited";
type DraftReviewPhoto = LunchReviewPhoto & {
  localId: string;
  file?: File;
};

function getLunchErrorCopy(error: unknown, scope: "list" | "recommendation") {
  if (!(error instanceof LunchApiError)) {
    return {
      title:
        scope === "list" ? "점심 후보를 불러오지 못했습니다." : "오늘의 추천을 계산하지 못했습니다.",
      description: "잠시 후 다시 시도해 주세요.",
    };
  }

  if (error.code === "config_error") {
    return {
      title: "점심 추천 설정이 비어 있습니다.",
      description: "운영 환경의 Kakao 설정을 먼저 확인해야 합니다.",
    };
  }

  if (error.code === "kakao_auth") {
    return {
      title: "카카오 인증 또는 허용 IP 설정이 필요합니다.",
      description: "운영진이 Kakao Local 앱 설정을 확인해야 합니다.",
    };
  }

  if (error.code === "kakao_quota") {
    return {
      title: "카카오 조회 한도에 도달했습니다.",
      description: "잠시 후 다시 시도하면 복구될 가능성이 높습니다.",
    };
  }

  if (error.code === "kakao_network") {
    return {
      title:
        scope === "list" ? "식당 목록 조회가 일시적으로 불안정합니다." : "추천 계산이 잠시 불안정합니다.",
      description: "목록이나 추천을 몇 초 뒤 다시 불러와 보세요.",
    };
  }

  return {
    title:
      scope === "list" ? "식당 목록을 불러오지 못했습니다." : "추천을 불러오지 못했습니다.",
    description: error.message,
  };
}

function formatDistance(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  return `${distance}m`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "방금";
  return new Date(value).toLocaleString("ko-KR");
}

function getVisitLabel(place: LunchPlace) {
  if (place.visitState === "visited") return "가봄";
  return "미기록";
}

function ReviewPhotoStrip({
  photos,
  editable = false,
  onRemove,
}: {
  photos: DraftReviewPhoto[];
  editable?: boolean;
  onRemove?: (photoLocalId: string) => void;
}) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((photo) => (
        <div
          key={photo.localId}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line-subtle bg-canvas/60"
        >
          <div
            role="img"
            aria-label="리뷰 사진"
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${photo.imageUrl})` }}
          />
          {editable && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(photo.localId)}
              className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white transition-colors hover:bg-black/70"
              aria-label="사진 삭제"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function LunchPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] w-full rounded-[32px]" />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-[560px] rounded-[28px]" />
        <Skeleton className="h-[560px] rounded-[28px]" />
      </div>
    </div>
  );
}

export function LunchPageClient({
  kakaoJavaScriptKey,
}: {
  kakaoJavaScriptKey: string | null;
}) {
  const reviewPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftPhotos, setDraftPhotos] = useState<DraftReviewPhoto[]>([]);
  const [visitFeedback, setVisitFeedback] = useState<{
    tone: "success" | "info" | "error";
    text: string;
  } | null>(null);
  const deferredSearch = useDeferredValue(searchInput);

  const {
    data: lunchData,
    isLoading,
    isError,
    error: lunchError,
    refetch: refetchLunchPlaces,
    isFetching: isRefetchingLunchPlaces,
  } = useLunchPlaces();
  const {
    data: recommendation,
    isLoading: isRecommendationLoading,
    isError: isRecommendationError,
    error: recommendationError,
    refetch: refetchRecommendation,
    isFetching: isRefetchingRecommendation,
  } = useLunchRecommendation();
  const saveVisitState = useSaveLunchVisitState();
  const createReview = useCreateLunchReview();
  const updateReview = useUpdateLunchReview();
  const deleteReview = useDeleteLunchReview();
  const uploadReviewImage = useUploadLunchReviewImage();

  const places = lunchData?.places ?? [];
  const filteredPlaces = places.filter((place) => {
    const matchesSearch =
      !deferredSearch.trim() ||
      [place.name, place.categoryName, place.addressName ?? "", place.roadAddressName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(deferredSearch.trim().toLowerCase());
    const matchesVisit =
      visitFilter === "all" || place.visitState === visitFilter;

    return matchesSearch && matchesVisit;
  });

  const selectedPlace =
    places.find((place) => place.id === selectedPlaceId) ??
    (recommendation ? places.find((place) => place.id === recommendation.place.id) : null) ??
    filteredPlaces[0] ??
    places[0] ??
    null;
  const selectedPlaceExternalUrl = selectedPlace
    ? getLunchPlaceExternalUrl(selectedPlace)
    : null;

  const { data: reviews = [], isLoading: isReviewsLoading } = useLunchReviews(selectedPlace?.id);

  useEffect(() => {
    const nextPlaces = lunchData?.places ?? [];
    if (selectedPlaceId || !nextPlaces.length) return;
    const nextId = recommendation?.place.id ?? nextPlaces[0]?.id ?? null;
    if (!nextId) return;
    setSelectedPlaceId(nextId);
  }, [lunchData, recommendation?.place.id, selectedPlaceId]);

  useEffect(() => {
    if (!selectedPlace) return;
    setDraftContent(selectedPlace.myReview?.content ?? "");
    setDraftPhotos(
      (selectedPlace.myReview?.photos ?? []).map((photo) => ({
        ...photo,
        localId: photo.id,
      })),
    );
  }, [selectedPlace]);

  useEffect(() => {
    setVisitFeedback(null);
  }, [selectedPlace?.id]);

  async function handleVisitState() {
    if (!selectedPlace) return;
    try {
      await saveVisitState.mutateAsync({
        placeId: selectedPlace.id,
        status: "visited",
      });
      setVisitFeedback({
        tone: "success",
        text: "오늘 가봤어요를 기록했어요. 내일 다시 누르면 카운트가 1 더 올라갑니다.",
      });
    } catch (error) {
      if (error instanceof LunchApiError && error.code === "visit_daily_limit") {
        setVisitFeedback({
          tone: "info",
          text: error.message,
        });
        return;
      }

      setVisitFeedback({
        tone: "error",
        text: "가봤어요를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    }
  }

  async function uploadDraftPhoto(file: File) {
    const uploaded = await uploadReviewImage.mutateAsync(file);
    return {
      localId: crypto.randomUUID(),
      id: crypto.randomUUID(),
      imageUrl: uploaded.url,
      sortOrder: draftPhotos.length,
      file,
    } satisfies DraftReviewPhoto;
  }

  async function handleReviewPhotoSelect(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const remaining = 3 - draftPhotos.length;
    if (remaining <= 0) {
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    const uploadedPhotos = await Promise.all(files.map((file) => uploadDraftPhoto(file)));

    setDraftPhotos((current) =>
      [...current, ...uploadedPhotos].map((photo, index) => ({
        ...photo,
        sortOrder: index,
      })),
    );
  }

  function handleRemoveDraftPhoto(photoLocalId: string) {
    setDraftPhotos((current) =>
      current
        .filter((photo) => photo.localId !== photoLocalId)
        .map((photo, index) => ({
          ...photo,
          sortOrder: index,
        })),
    );
  }

  async function handleSubmitReview() {
    if (!selectedPlace) return;
    const content = draftContent.trim();
    if (!content) return;
    const photoUrls = draftPhotos.map((photo) => photo.imageUrl);

    if (selectedPlace.myReview) {
      await updateReview.mutateAsync({
        reviewId: selectedPlace.myReview.id,
        placeId: selectedPlace.id,
        content,
        photoUrls,
      });
      return;
    }

    await createReview.mutateAsync({
      placeId: selectedPlace.id,
      content,
      photoUrls,
    });
  }

  async function handleDeleteReview() {
    if (!selectedPlace?.myReview) return;
    await deleteReview.mutateAsync({
      reviewId: selectedPlace.myReview.id,
      placeId: selectedPlace.id,
    });
    setDraftContent("");
    setDraftPhotos([]);
  }

  if (isLoading) {
    return <LunchPageSkeleton />;
  }

  if (isError || !lunchData) {
    const copy = getLunchErrorCopy(lunchError, "list");
    return (
      <div className="mx-auto max-w-3xl rounded-[32px] border border-line-subtle bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#fff3e0] text-[#8c5a19]">
          <TriangleAlert className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-text-strong">{copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">{copy.description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={() => refetchLunchPlaces()}
            disabled={isRefetchingLunchPlaces}
          >
            {isRefetchingLunchPlaces && (
              <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
            )}
            다시 시도
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#f0d8a7]/60 bg-[radial-gradient(circle_at_top_left,_rgba(255,229,180,0.65),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,122,54,0.18),_transparent_26%),linear-gradient(135deg,_rgba(32,23,10,0.98),_rgba(74,49,20,0.96))] px-6 py-8 text-white shadow-[0_32px_80px_rgba(74,49,20,0.24)] sm:px-8">
        <div className="absolute right-4 top-4 h-28 w-28 rounded-full bg-white/6 blur-2xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              <UtensilsCrossed className="size-3.5" />
              이대역 500m 런치 데크
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                오늘 이거 드실래요?
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72 sm:text-base">
                카카오 Local 기준 이대역 반경 500m 식당을 실시간으로 모아, 가본 사람 수와
                원우 메모·사진까지 같이 보여줍니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/70">
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
                실시간 후보 {places.length}곳
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
                카카오 pageable_count 최대 {lunchData.sourceMeta.maxReachableCount}곳
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
                가본 기록 {places.reduce((sum, place) => sum + place.visitedCount, 0)}건
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
                메모 {places.reduce((sum, place) => sum + place.memoCount, 0)}개
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1">
                마지막 실시간 조회 {formatDateTime(lunchData.fetchedAt)}
              </span>
            </div>
          </div>

          <div className="w-full max-w-md rounded-[28px] border border-white/12 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-white/65">
              <Sparkles className="size-3.5" />
              오늘의 추천
            </div>
            {isRecommendationLoading ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-6 w-1/2 bg-white/10" />
                <Skeleton className="h-12 w-full bg-white/10" />
              </div>
            ) : isRecommendationError ? (
              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/15 p-4">
                <p className="text-sm font-medium text-white">
                  {getLunchErrorCopy(recommendationError, "recommendation").title}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  {getLunchErrorCopy(recommendationError, "recommendation").description}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchRecommendation()}
                  disabled={isRefetchingRecommendation}
                  className="mt-4 border-white/20 bg-white/8 text-white hover:bg-white/16 hover:text-white"
                >
                  {isRefetchingRecommendation && (
                    <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
                  )}
                  <RefreshCcw data-icon="inline-start" className="size-3.5" />
                  추천 다시 시도
                </Button>
              </div>
            ) : recommendation ? (
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    startTransition(() => setSelectedPlaceId(recommendation.place.id))
                  }
                  className="w-full rounded-[22px] border border-white/10 bg-black/15 p-4 text-left transition-colors hover:bg-black/25"
                >
                  {recommendation.place.heroImageUrl && (
                    <div className="mb-4 overflow-hidden rounded-[18px] border border-white/10">
                      <div
                        role="img"
                        aria-label={`${recommendation.place.name} 리뷰 사진`}
                        className="h-36 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${recommendation.place.heroImageUrl})` }}
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xl font-semibold">{recommendation.place.name}</div>
                      <div className="mt-1 text-sm text-white/70">
                        {recommendation.place.categoryName}
                      </div>
                    </div>
                    <Badge className="border-transparent bg-[#f59e0b] text-[#2c1a00]">
                      {formatDistance(recommendation.place.distance)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/78">{recommendation.reason}</p>
                  <div className="mt-3 text-xs text-white/55">
                    {recommendation.reused ? "오늘 저장된 추천" : "새로 계산한 추천"} ·{" "}
                    {formatDateTime(recommendation.createdAt)}
                  </div>
                </button>
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/15 p-4 text-sm text-white/72">
                오늘 추천할 식당이 아직 없습니다. 목록은 그대로 둘러보고, 방문 기록과
                메모를 쌓으면 추천 품질을 더 높일 수 있습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="order-2 space-y-4 xl:order-1">
          <Card className="rounded-[28px] border border-line-subtle bg-surface/90">
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>근처 식당 목록</CardTitle>
                  <p className="text-sm text-text-muted">
                    이름, 주소로 필터링하고 방문 여부를 바로 남길 수 있습니다.
                  </p>
                </div>
                <Badge variant="muted" className="rounded-full px-3 py-1">
                  {filteredPlaces.length} / {places.length}
                </Badge>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="식당명 또는 주소 검색"
                  className="h-10 rounded-2xl border-line-subtle pl-9"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: "all", label: "전체" },
                  { key: "visited", label: "가봄" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setVisitFilter(filter.key as VisitFilter)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      visitFilter === filter.key
                        ? "border-[#8c5a19] bg-[#8c5a19]/10 text-[#8c5a19]"
                        : "border-line-subtle text-text-muted hover:bg-canvas",
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {filteredPlaces.length > 0 ? (
                <div className="space-y-3">
                  {filteredPlaces.map((place) => {
                    const selected = place.id === selectedPlace?.id;
                    return (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => startTransition(() => setSelectedPlaceId(place.id))}
                        className={cn(
                          "w-full rounded-[24px] border p-4 text-left transition-all",
                          selected
                            ? "border-[#8c5a19]/40 bg-[#fff8ef] shadow-[0_16px_40px_rgba(140,90,25,0.08)]"
                            : "border-line-subtle bg-canvas/60 hover:bg-canvas",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base font-semibold text-text-strong">
                                {place.name}
                              </span>
                              <Badge
                                variant={place.visitState === "visited" ? "default" : "muted"}
                                className={cn(
                                  "rounded-full px-2.5 py-0.5",
                                  place.visitState === "visited"
                                    ? "bg-[#0f766e] text-white"
                                    : "",
                                )}
                              >
                                {getVisitLabel(place)}
                              </Badge>
                            </div>
                            <div className="mt-1 line-clamp-1 text-sm text-text-muted">
                              {place.categoryName}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="size-3.5" />
                                {place.roadAddressName ?? place.addressName ?? "주소 미확인"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Store className="size-3.5" />
                                {formatDistance(place.distance)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="mt-1 text-xs text-text-muted">
                              가본 사람 {place.visitedCount}명
                            </div>
                            <div className="mt-1 text-xs text-text-muted">
                              메모 {place.memoCount}개
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-line-subtle px-4 py-10 text-center text-sm text-text-muted">
                  조건에 맞는 식당이 없습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="order-1 space-y-4 xl:order-2">
          {selectedPlace ? (
            <>
              <Card className="rounded-[28px] border border-line-subtle bg-surface/95">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{selectedPlace.name}</CardTitle>
                        <Badge variant="muted" className="rounded-full px-3 py-1">
                          {selectedPlace.categoryName}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-text-muted">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-4" />
                          {selectedPlace.roadAddressName ??
                            selectedPlace.addressName ??
                            "주소 미확인"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Store className="size-4" />
                          이대역에서 {formatDistance(selectedPlace.distance)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl border border-line-subtle bg-canvas/50 px-4 py-3 text-center">
                        <div className="font-semibold text-text-strong">
                          {selectedPlace.visitedCount}
                        </div>
                        <div className="mt-1 text-xs text-text-muted">가본 사람 수</div>
                      </div>
                      <div className="rounded-2xl border border-line-subtle bg-canvas/50 px-4 py-3 text-center">
                        <div className="font-semibold text-text-strong">
                          {selectedPlace.memoCount}
                        </div>
                        <div className="mt-1 text-xs text-text-muted">메모 수</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={selectedPlace.visitState === "visited" ? "default" : "outline"}
                      onClick={() => handleVisitState()}
                      disabled={saveVisitState.isPending}
                    >
                      {saveVisitState.isPending && (
                        <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
                      )}
                      가봤어요
                    </Button>
                    {selectedPlaceExternalUrl && (
                      <a
                        href={selectedPlaceExternalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        <ExternalLink data-icon="inline-start" className="size-3.5" />
                        카카오맵 열기
                      </a>
                    )}
                  </div>
                  {visitFeedback && (
                    <p
                      className={cn(
                        "text-sm",
                        visitFeedback.tone === "success" && "text-success",
                        visitFeedback.tone === "info" && "text-text-muted",
                        visitFeedback.tone === "error" && "text-error",
                      )}
                    >
                      {visitFeedback.text}
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {selectedPlace.heroImageUrl && (
                    <div className="overflow-hidden rounded-[24px] border border-line-subtle bg-canvas/50">
                      <div
                        role="img"
                        aria-label={`${selectedPlace.name} 대표 리뷰 사진`}
                        className="h-52 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${selectedPlace.heroImageUrl})` }}
                      />
                    </div>
                  )}

                  <KakaoMap place={selectedPlace} kakaoJavaScriptKey={kakaoJavaScriptKey} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[24px] border border-line-subtle bg-canvas/50 p-4">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                        내 기록
                      </div>
                      <div className="mt-2 text-lg font-semibold text-text-strong">
                        {getVisitLabel(selectedPlace)}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-text-muted">
                        점심 결정 전에 가본 곳인지 바로 확인할 수 있습니다.
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-line-subtle bg-canvas/50 p-4">
                      <div className="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
                        연락처
                      </div>
                      <div className="mt-2 text-lg font-semibold text-text-strong">
                        {selectedPlace.phone || "전화번호 없음"}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-text-muted">
                        상세 위치와 링크는 카카오맵 원문으로 바로 이동할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border border-line-subtle bg-surface/95">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="size-4 text-[#8c5a19]" />
                    <CardTitle>원우 메모 & 사진</CardTitle>
                  </div>
                  <p className="text-sm text-text-muted">
                    식당당 1인 1메모 정책입니다. 짧은 메모와 사진 최대 3장까지 남길 수 있습니다.
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-[24px] border border-line-subtle bg-canvas/45 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-text-strong">
                          {selectedPlace.myReview ? "내 메모 수정" : "내 메모 남기기"}
                        </div>
                        <div className="mt-1 text-xs text-text-muted">
                          {selectedPlace.myReview
                            ? `마지막 수정 ${formatDateTime(selectedPlace.myReview.updatedAt)}`
                            : "짧은 메모와 사진으로 분위기를 남겨보세요."}
                        </div>
                      </div>
                    </div>

                    <Textarea
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      placeholder="예: 혼밥하기 편하고 회전이 빨랐어요."
                      className="mt-4 min-h-28 rounded-2xl border-line-subtle bg-surface"
                    />

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-text-muted">
                          리뷰 사진은 최대 3장까지 올릴 수 있습니다.
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => reviewPhotoInputRef.current?.click()}
                          disabled={uploadReviewImage.isPending || draftPhotos.length >= 3}
                        >
                          {uploadReviewImage.isPending ? (
                            <Loader2
                              data-icon="inline-start"
                              className="size-3.5 animate-spin"
                            />
                          ) : (
                            <ImagePlus data-icon="inline-start" className="size-3.5" />
                          )}
                          사진 추가
                        </Button>
                        <input
                          ref={reviewPhotoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleReviewPhotoSelect(e.target.files).catch(() => {});
                            e.target.value = "";
                          }}
                        />
                      </div>

                      <ReviewPhotoStrip
                        photos={draftPhotos}
                        editable
                        onRemove={handleRemoveDraftPhoto}
                      />
                      {uploadReviewImage.error instanceof Error && (
                        <p className="text-xs text-error">
                          {uploadReviewImage.error.message}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSubmitReview}
                        disabled={
                          createReview.isPending ||
                          updateReview.isPending ||
                          uploadReviewImage.isPending ||
                          !draftContent.trim()
                        }
                      >
                        {(createReview.isPending || updateReview.isPending) && (
                          <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
                        )}
                        {selectedPlace.myReview ? "메모 수정" : "메모 등록"}
                      </Button>
                      {selectedPlace.myReview && (
                        <Button
                          variant="outline"
                          onClick={handleDeleteReview}
                          disabled={deleteReview.isPending}
                        >
                          {deleteReview.isPending && (
                            <Loader2
                              data-icon="inline-start"
                              className="size-3.5 animate-spin"
                            />
                          )}
                          메모 삭제
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {isReviewsLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-24 rounded-[22px]" />
                        <Skeleton className="h-24 rounded-[22px]" />
                      </div>
                    ) : reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-[24px] border border-line-subtle bg-canvas/45 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={review.userAvatar}
                              name={review.userName || "원우"}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-text-strong">
                                {review.userName || "이름 미상"}
                              </span>
                              {review.isMine && (
                                <Badge variant="muted" className="rounded-full px-2 py-0.5">
                                    내 메모
                                </Badge>
                              )}
                            </div>
                              <div className="mt-1 text-xs text-text-muted">
                                {formatDateTime(review.updatedAt)}
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text-main">
                                {review.content}
                              </p>
                              <div className="mt-3">
                                <ReviewPhotoStrip
                                  photos={review.photos.map((photo) => ({
                                    ...photo,
                                    localId: photo.id,
                                  }))}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-line-subtle px-4 py-10 text-center text-sm text-text-muted">
                        아직 등록된 메모가 없습니다.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-[28px] border border-dashed border-line-subtle bg-surface/70">
              <CardContent className="px-6 py-12 text-center text-sm text-text-muted">
                선택된 식당이 없습니다.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
