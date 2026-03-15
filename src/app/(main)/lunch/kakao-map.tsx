"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Map } from "lucide-react";
import Script from "next/script";
import { getLunchPlaceExternalUrl } from "@/lib/lunch-links";
import type { LunchPlace } from "@/types/lunch";

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (
          container: HTMLElement,
          options: { center: unknown; level: number },
        ) => unknown;
        Marker: new (options: { map: unknown; position: unknown; title?: string }) => unknown;
        Circle: new (options: {
          center: unknown;
          radius: number;
          strokeWeight: number;
          strokeColor: string;
          strokeOpacity: number;
          fillColor: string;
          fillOpacity: number;
        }) => {
          setMap: (map: unknown) => void;
        };
      };
    };
  }
}

const EWHA_CENTER = {
  x: 126.946512,
  y: 37.556733,
};

export function KakaoMap({
  place,
  kakaoJavaScriptKey,
}: {
  place: LunchPlace;
  kakaoJavaScriptKey: string | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const externalUrl = getLunchPlaceExternalUrl(place);
  const [isReady, setIsReady] = useState(
    typeof window !== "undefined" && Boolean(window.kakao?.maps),
  );
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!kakaoJavaScriptKey) return;
    if (isReady) {
      setLoadError(false);
      return;
    }

    const timer = window.setTimeout(() => {
      if (!window.kakao?.maps) {
        setLoadError(true);
      }
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [isReady, kakaoJavaScriptKey]);

  useEffect(() => {
    if (!kakaoJavaScriptKey || !isReady || !containerRef.current || !window.kakao?.maps) {
      return;
    }

    let cancelled = false;
    window.kakao.maps.load(() => {
      if (cancelled || !containerRef.current || !window.kakao?.maps) return;

      const kakao = window.kakao;
      const mapCenter = new kakao.maps.LatLng(place.y, place.x);
      const radiusCenter = new kakao.maps.LatLng(EWHA_CENTER.y, EWHA_CENTER.x);
      const map = new kakao.maps.Map(containerRef.current, {
        center: mapCenter,
        level: 4,
      });

      new kakao.maps.Marker({
        map,
        position: mapCenter,
        title: place.name,
      });

      const radiusCircle = new kakao.maps.Circle({
        center: radiusCenter,
        radius: 500,
        strokeWeight: 1,
        strokeColor: "#0f766e",
        strokeOpacity: 0.65,
        fillColor: "#99f6e4",
        fillOpacity: 0.18,
      });
      radiusCircle.setMap(map);
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, kakaoJavaScriptKey, place.id, place.name, place.x, place.y]);

  if (!kakaoJavaScriptKey || loadError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-line-subtle bg-canvas/50 px-6 text-center text-sm text-text-muted">
        <div className="flex size-11 items-center justify-center rounded-full bg-surface">
          <Map className="size-5" />
        </div>
        <div>
          <p className="font-medium text-text-strong">
            {!kakaoJavaScriptKey
              ? "지도 키가 설정되지 않아 지도를 표시할 수 없습니다."
              : "카카오 지도 SDK를 불러오지 못했습니다."}
          </p>
          <p className="mt-1">
            텍스트 주소와 카카오맵 원문 링크만으로도 장소를 확인할 수 있습니다.
          </p>
        </div>
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
    );
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoJavaScriptKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
        onError={() => setLoadError(true)}
      />
      <div
        ref={containerRef}
        className="h-64 overflow-hidden rounded-[24px] border border-line-subtle bg-canvas/50"
      />
    </>
  );
}
