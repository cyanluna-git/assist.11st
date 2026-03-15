"use client";

import { FormEvent, useState } from "react";
import {
  Ban,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBabzipData, useBabzipSearch, useToggleBabzipExclusion } from "@/hooks/use-babzip";
import { getLunchPlaceExternalUrl } from "@/lib/lunch-links";
import type { LunchPlace, LunchPlaceExclusion } from "@/types/lunch";

function formatDistance(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  return `${distance}m`;
}

function PlaceRow({
  place,
  excluded,
  isPending,
  onToggle,
}: {
  place: LunchPlace;
  excluded: boolean;
  isPending: boolean;
  onToggle: (place: LunchPlace, nextExcluded: boolean) => void;
}) {
  const address = place.roadAddressName ?? place.addressName ?? "주소 미확인";
  const externalUrl = getLunchPlaceExternalUrl(place);

  return (
    <div className="rounded-2xl border border-line-subtle bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text-strong">{place.name}</h3>
            <Badge variant="outline">{formatDistance(place.distance)}</Badge>
            {excluded && (
              <Badge className="border-transparent bg-rose-100 text-rose-700">
                점심 제외
              </Badge>
            )}
          </div>
          <p className="text-sm text-text-muted">{place.categoryName}</p>
          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {address}
            </span>
            <span className="inline-flex items-center gap-1">
              <Store className="size-3.5" />
              {place.phone || "전화번호 미기록"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-text-main transition-colors hover:bg-muted hover:text-foreground"
          >
            카카오지도
            <ExternalLink className="size-3.5" />
          </a>
          <Button
            type="button"
            size="sm"
            variant={excluded ? "outline" : "default"}
            disabled={isPending}
            onClick={() => onToggle(place, !excluded)}
          >
            {isPending ? (
              <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
            ) : excluded ? (
              <RefreshCcw data-icon="inline-start" className="size-3.5" />
            ) : (
              <Ban data-icon="inline-start" className="size-3.5" />
            )}
            {excluded ? "제외 해제" : "점심 제외"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ExclusionRow({
  item,
  isPending,
  onRestore,
}: {
  item: LunchPlaceExclusion;
  isPending: boolean;
  onRestore: (item: LunchPlaceExclusion) => void;
}) {
  const externalUrl = getLunchPlaceExternalUrl({
    id: item.kakaoPlaceId,
    name: item.placeName,
    x: 0,
    y: 0,
    placeUrl: null,
  });

  return (
    <div className="rounded-2xl border border-line-subtle bg-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text-strong">{item.placeName}</h3>
            <Badge className="border-transparent bg-rose-100 text-rose-700">제외됨</Badge>
          </div>
          <p className="text-sm text-text-muted">{item.categoryName || "카테고리 미확인"}</p>
          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {item.roadAddressName ?? item.addressName ?? "주소 미확인"}
            </span>
            <span>저장일 {new Date(item.updatedAt).toLocaleString("ko-KR")}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-text-main transition-colors hover:bg-muted hover:text-foreground"
          >
            카카오지도
            <ExternalLink className="size-3.5" />
          </a>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => onRestore(item)}
          >
            {isPending ? (
              <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
            ) : (
              <RefreshCcw data-icon="inline-start" className="size-3.5" />
            )}
            다시 허용
          </Button>
        </div>
      </div>
    </div>
  );
}

function BabzipSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-56 rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-[480px] rounded-[28px]" />
        <Skeleton className="h-[480px] rounded-[28px]" />
      </div>
    </div>
  );
}

export function BabzipPageClient() {
  const { data, isLoading, isError, error } = useBabzipData();
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
  const search = useBabzipSearch(submittedQuery);
  const toggleExclusion = useToggleBabzipExclusion();

  const exclusions = data?.exclusions ?? [];
  const exclusionIdSet = new Set(exclusions.map((item) => item.kakaoPlaceId));
  const candidates = data?.candidates ?? [];
  const visibleCount = candidates.filter((place) => !exclusionIdSet.has(place.id)).length;
  const searchPlaces = search.data?.places ?? [];

  async function handleToggle(place: LunchPlace, excluded: boolean) {
    setPendingPlaceId(place.id);
    try {
      await toggleExclusion.mutateAsync({
        placeId: place.id,
        placeName: place.name,
        categoryName: place.categoryName,
        roadAddressName: place.roadAddressName,
        addressName: place.addressName,
        excluded,
      });
    } finally {
      setPendingPlaceId(null);
    }
  }

  async function handleRestore(item: LunchPlaceExclusion) {
    setPendingPlaceId(item.kakaoPlaceId);
    try {
      await toggleExclusion.mutateAsync({
        placeId: item.kakaoPlaceId,
        placeName: item.placeName,
        categoryName: item.categoryName,
        roadAddressName: item.roadAddressName,
        addressName: item.addressName,
        excluded: false,
      });
    } finally {
      setPendingPlaceId(null);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
  }

  if (isLoading) {
    return <BabzipSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-medium text-text-strong">
          밥집 큐레이션 데이터를 불러오지 못했습니다.
        </p>
        <p className="max-w-lg text-sm text-text-muted">
          {error instanceof Error ? error.message : "관리자 권한 또는 카카오 조회 상태를 확인해 주세요."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-[#ddc39a] bg-[radial-gradient(circle_at_top_left,_rgba(255,242,209,0.32),_transparent_35%),linear-gradient(135deg,_rgba(52,36,18,0.96),_rgba(94,66,33,0.92))] px-6 py-8 text-white sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/85">
              <UtensilsCrossed className="size-3.5" />
              hidden admin tool
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                밥집 큐레이션
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
                기본값은 전체 허용입니다. 점심에 맞지 않는 후보만 제외하면 `/lunch`와 홈
                추천 위젯에서 자동으로 빠집니다.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2">
              현재 후보 {candidates.length}곳
            </span>
            <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2">
              현재 노출 {visibleCount}곳
            </span>
            <span className="rounded-full border border-white/14 bg-white/8 px-3 py-2">
              제외 {exclusions.length}곳
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>추가 탐색</CardTitle>
              <p className="text-sm text-text-muted">
                현재 45개 후보 밖의 식당도 검색해서 미리 제외해 둘 수 있습니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSearchSubmit}>
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="식당 이름이나 키워드를 검색"
                />
                <Button type="submit" disabled={!query.trim()}>
                  <Search data-icon="inline-start" className="size-3.5" />
                  검색
                </Button>
              </form>

              {submittedQuery && search.isLoading && (
                <div className="rounded-2xl border border-dashed border-line-subtle bg-muted/30 p-4 text-sm text-text-muted">
                  검색 결과를 불러오는 중입니다.
                </div>
              )}

              {submittedQuery && search.isError && (
                <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {search.error instanceof Error
                    ? search.error.message
                    : "검색 결과를 불러오지 못했습니다."}
                </div>
              )}

              {submittedQuery &&
                !search.isLoading &&
                !search.isError &&
                searchPlaces.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-line-subtle bg-muted/30 p-4 text-sm text-text-muted">
                    검색 결과가 없습니다.
                  </div>
                )}

              {searchPlaces.length > 0 && (
                <div className="space-y-3">
                  {searchPlaces.map((place) => (
                    <PlaceRow
                      key={`search-${place.id}`}
                      place={place}
                      excluded={exclusionIdSet.has(place.id)}
                      isPending={pendingPlaceId === place.id}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>현재 500m 후보</CardTitle>
              <p className="text-sm text-text-muted">
                Kakao Local 실시간 후보입니다. 제외 표시된 식당은 `/lunch`와 추천에서 빠집니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.map((place) => (
                <PlaceRow
                  key={place.id}
                  place={place}
                  excluded={exclusionIdSet.has(place.id)}
                  isPending={pendingPlaceId === place.id}
                  onToggle={handleToggle}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>제외 목록</CardTitle>
              <p className="text-sm text-text-muted">
                여기 있는 식당만 숨겨지고, 나머지는 기본적으로 모두 점심 후보로 유지됩니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {exclusions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-line-subtle bg-muted/30 p-4 text-sm text-text-muted">
                  아직 제외한 식당이 없습니다. 현재는 전체 후보가 그대로 `/lunch`에 노출됩니다.
                </div>
              )}

              {exclusions.map((item) => (
                <ExclusionRow
                  key={item.id}
                  item={item}
                  isPending={pendingPlaceId === item.kakaoPlaceId}
                  onRestore={handleRestore}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
