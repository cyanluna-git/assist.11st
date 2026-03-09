"use client";

import Link from "next/link";
import Image from "next/image";
import { ImageIcon, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlbums } from "@/hooks/use-gallery";

export function GalleryWidget() {
  const { data: albums, isLoading } = useAlbums(4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>갤러리</CardTitle>
        <CardAction>
          <Link
            href="/gallery"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && (!albums || albums.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-6 text-text-muted">
            <ImageIcon className="size-8 opacity-40" />
            <p className="text-sm">등록된 앨범이 없습니다</p>
          </div>
        )}

        {!isLoading && albums && albums.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/gallery/${album.id}`}
                className="group overflow-hidden rounded-lg bg-muted"
              >
                <div className="relative aspect-square overflow-hidden">
                  {album.coverImageUrl ? (
                    <Image
                      src={album.coverImageUrl}
                      alt={album.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-6 text-text-muted opacity-40" />
                    </div>
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs font-medium text-text-strong">
                  {album.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
