"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Photo } from "@/types/gallery";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onDelete?: (photoId: string) => void;
  canDelete?: (photo: Photo) => boolean;
}

export function Lightbox({
  photos,
  currentIndex,
  onClose,
  onIndexChange,
  onDelete,
  canDelete,
}: LightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const photo = photos[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(currentIndex - 1);
  }, [hasPrev, currentIndex, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(currentIndex + 1);
  }, [hasNext, currentIndex, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "ArrowRight":
          goNext();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  // Preload adjacent images
  useEffect(() => {
    const preload = (idx: number) => {
      if (idx >= 0 && idx < photos.length) {
        const img = new window.Image();
        img.src = photos[idx].imageUrl;
      }
    };
    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }, [currentIndex, photos]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  // Click backdrop to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!photo) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <span className="text-sm text-white/70">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          {canDelete?.(photo) && onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => onDelete(photo.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      {/* Image */}
      <div className="relative flex h-full w-full items-center justify-center px-16 py-20">
        <Image
          src={photo.imageUrl}
          alt={photo.caption || "사진"}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Caption */}
      {photo.caption && (
        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
          <p className="text-center text-sm text-white">{photo.caption}</p>
        </div>
      )}

      {/* Navigation arrows */}
      {hasPrev && (
        <button
          type="button"
          className="absolute left-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          onClick={goPrev}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          className="absolute right-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
          onClick={goNext}
        >
          <ChevronRight className="size-6" />
        </button>
      )}
    </div>
  );
}
