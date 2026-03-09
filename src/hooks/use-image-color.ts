"use client";

import { useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";

interface ImageColors {
  primary: string;
  dark: string;
}

const cache = new Map<string, ImageColors>();

function darken(hex: string, amount = 40): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function useImageColor(imageUrl: string | null | undefined): ImageColors | null {
  const [colors, setColors] = useState<ImageColors | null>(
    imageUrl && cache.has(imageUrl) ? cache.get(imageUrl)! : null,
  );

  useEffect(() => {
    if (!imageUrl) return;

    if (cache.has(imageUrl)) {
      setColors(cache.get(imageUrl)!);
      return;
    }

    const fac = new FastAverageColor();
    const img = new Image();
    img.crossOrigin = "anonymous";
    // Proxy external URLs to avoid CORS issues with R2 public URLs
    const proxyUrl = imageUrl.startsWith("http")
      ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;
    img.src = proxyUrl;

    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      try {
        const result = fac.getColor(img, { algorithm: "dominant" });
        const primary = result.hex;
        const dark = darken(primary, 50);
        const value = { primary, dark };
        cache.set(imageUrl, value);
        setColors(value);
      } catch {
        // silently fail — fallback gradient will be used
      }
      fac.destroy();
    };

    img.onerror = () => {
      fac.destroy();
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return colors;
}
