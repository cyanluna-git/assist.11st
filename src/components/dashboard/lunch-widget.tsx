"use client";

import Link from "next/link";
import {
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLunchRecommendation } from "@/hooks/use-lunch";
import { getLunchPlaceExternalUrl } from "@/lib/lunch-links";

function formatDistance(distance: number) {
  if (distance >= 1000) {
    return `${(distance / 1000).toFixed(1)}km`;
  }
  return `${distance}m`;
}

export function LunchWidget() {
  const { data: recommendation, isLoading, isError } = useLunchRecommendation();
  const externalUrl = recommendation
    ? getLunchPlaceExternalUrl(recommendation.place)
    : null;

  return (
    <Card className="overflow-hidden border-[#ecd8b6] bg-[radial-gradient(circle_at_top_left,_rgba(255,239,201,0.95),_rgba(255,250,242,0.9)_42%,_rgba(255,255,255,0.98)_100%)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#d8b16d]/40 bg-[#fff5e2] px-3 py-1 text-[11px] font-medium text-[#8c5a19]">
              <UtensilsCrossed className="size-3.5" />
              점심 추천
            </div>
            <CardTitle>오늘 이거 드실래요?</CardTitle>
          </div>
          <CardAction>
            <Link
              href="/lunch"
              className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
            >
              전체보기
              <ChevronRight className="size-3.5" />
            </Link>
          </CardAction>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-2xl border border-dashed border-line-subtle bg-white/70 p-4">
            <p className="text-sm font-medium text-text-strong">
              점심 추천을 불러오지 못했습니다.
            </p>
            <p className="mt-1 text-sm text-text-muted">
              카카오 조회 상태를 확인한 뒤 `/lunch`에서 다시 시도할 수 있습니다.
            </p>
            <Link
              href="/lunch"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#8c5a19] transition-colors hover:text-brand"
            >
              점심 페이지 열기
              <ChevronRight className="size-4" />
            </Link>
          </div>
        )}

        {!isLoading && !isError && !recommendation && (
          <div className="rounded-2xl border border-dashed border-line-subtle bg-white/70 p-4">
            <p className="text-sm font-medium text-text-strong">
              아직 오늘의 추천이 없습니다.
            </p>
            <p className="mt-1 text-sm text-text-muted">
              `/lunch`에서 식당 목록과 방문 기록을 먼저 확인해 보세요.
            </p>
          </div>
        )}

        {!isLoading && !isError && recommendation && (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[#ead6b4] bg-white/78 p-4 shadow-[0_18px_40px_rgba(140,90,25,0.08)]">
              {recommendation.place.heroImageUrl && (
                <div className="mb-4 overflow-hidden rounded-[18px] border border-[#ead6b4]">
                  <div
                    role="img"
                    aria-label={`${recommendation.place.name} 대표 리뷰 사진`}
                    className="h-36 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${recommendation.place.heroImageUrl})` }}
                  />
                </div>
              )}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-text-strong">
                      {recommendation.place.name}
                    </h3>
                    <Badge className="border-transparent bg-[#f7c66a] text-[#4a2d00]">
                      {formatDistance(recommendation.place.distance)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {recommendation.place.categoryName}
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 rounded-full bg-[#fff5e2] px-3 py-1 text-xs font-medium text-[#8c5a19]">
                  <Sparkles className="size-3.5" />
                  {recommendation.reused ? "오늘 저장된 추천" : "새로 계산된 추천"}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-text-main">
                {recommendation.reason}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {recommendation.place.roadAddressName ??
                    recommendation.place.addressName ??
                    "주소 미확인"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Store className="size-3.5" />
                  가본 사람 {recommendation.place.visitedCount}명
                </span>
                <span className="inline-flex items-center gap-1">
                  메모 {recommendation.place.memoCount}개
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/lunch"
                className="inline-flex items-center gap-1 rounded-full bg-[#8c5a19] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand"
              >
                점심 상세 보기
                <ChevronRight className="size-4" />
              </Link>
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#8c5a19] transition-colors hover:text-brand"
                >
                  카카오맵 열기
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
