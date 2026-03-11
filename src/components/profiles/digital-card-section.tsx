"use client";

import { useRef, useState, useEffect } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DigitalCard } from "./digital-card";
import type { ProfileDetail } from "@/types/profile";

const CARD_WIDTH = 384;
const CARD_HEIGHT = 208;

export function DigitalCardSection({ profile }: { profile: ProfileDetail }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://assist11th.vercel.app";

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setScale(Math.min(1, width / CARD_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${profile.name ?? "profile"}-card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-strong">디지털 명함</h3>
      <div
        ref={containerRef}
        className="w-full overflow-hidden"
        style={{ height: `${CARD_HEIGHT * scale}px` }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${CARD_WIDTH}px`,
          }}
        >
          <DigitalCard ref={cardRef} profile={profile} baseUrl={baseUrl} />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          QR 코드 스캔 시 프로필 페이지로 이동합니다
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <Download className="size-3.5" />
          {isDownloading ? "저장 중..." : "PNG 저장"}
        </Button>
      </div>
    </div>
  );
}
