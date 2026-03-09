"use client";

import Image from "next/image";
import type { Photo } from "@/types/gallery";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-lg bg-muted p-8 text-center text-sm text-text-muted">
        아직 업로드된 사진이 없습니다.
      </div>
    );
  }

  return (
    <div className="columns-2 gap-2 sm:columns-3 lg:columns-4">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="group mb-2 cursor-pointer break-inside-avoid overflow-hidden rounded-lg"
          onClick={() => onPhotoClick(index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPhotoClick(index);
          }}
        >
          <div className="relative">
            <Image
              src={photo.thumbnailUrl || photo.imageUrl}
              alt={photo.caption || "사진"}
              width={400}
              height={300}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            {photo.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs text-white">{photo.caption}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
