"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlbumCard } from "@/components/gallery/album-card";
import { AlbumCardSkeleton } from "@/components/gallery/album-card-skeleton";
import { CreateAlbumDialog } from "@/components/gallery/create-album-dialog";
import { useAlbums } from "@/hooks/use-gallery";

const PAGE_SIZE = 12;

export function GalleryPageClient() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const { data: albums, isLoading, isError } = useAlbums(limit);

  const hasMore = (albums?.length ?? 0) >= limit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">갤러리</h1>
          <p className="mt-1 text-sm text-text-muted">
            ASSIST 11기 사진 앨범
          </p>
        </div>
        <CreateAlbumDialog />
      </div>

      {/* Loading */}
      {isLoading && <AlbumCardSkeleton />}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          앨범을 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Empty */}
      {albums && albums.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted p-12 text-center">
          <ImageIcon className="size-10 text-text-muted opacity-40" />
          <div>
            <p className="text-sm font-medium text-text-muted">
              아직 앨범이 없습니다
            </p>
            <p className="mt-1 text-xs text-text-muted">
              첫 번째 앨범을 만들어 보세요!
            </p>
          </div>
        </div>
      )}

      {/* Album grid */}
      {albums && albums.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLimit((prev) => prev + PAGE_SIZE)}
              >
                더보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
