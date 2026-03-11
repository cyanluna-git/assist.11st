"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { DigitalCard } from "./digital-card";
import type { Profile } from "@/types/profile";

const CARD_WIDTH = 384;
const CARD_HEIGHT = 208;

export function DigitalCardGridItem({ profile }: { profile: Profile }) {
  const containerRef = useRef<HTMLDivElement>(null);
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

  return (
    <Link href={`/profiles/${profile.id}`} className="cursor-pointer block">
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
            flexShrink: 0,
          }}
        >
          <DigitalCard profile={profile} baseUrl={baseUrl} />
        </div>
      </div>
    </Link>
  );
}
