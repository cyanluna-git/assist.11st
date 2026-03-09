"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import type { AlbumSummary } from "@/types/gallery";

interface AlbumCardProps {
  album: AlbumSummary;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/gallery/${album.id}`}
      className="group overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-shadow hover:ring-foreground/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={album.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="size-10 text-text-muted opacity-40" />
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Badge variant="secondary" className="gap-1 bg-black/60 text-white">
            <Camera className="size-3" />
            {album.photoCount}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-text-strong">
          {album.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
          <span>{album.creatorName ?? "알 수 없음"}</span>
          <span>&middot;</span>
          <span>{formatDate(album.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
