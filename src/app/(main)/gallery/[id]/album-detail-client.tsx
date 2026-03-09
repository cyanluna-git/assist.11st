"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Pencil,
  Trash2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { PhotoUpload } from "@/components/gallery/photo-upload";
import { Lightbox } from "@/components/gallery/lightbox";
import {
  useAlbum,
  useUpdateAlbum,
  useDeleteAlbum,
  useDeletePhoto,
} from "@/hooks/use-gallery";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format-date";

export function AlbumDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError } = useAlbum(id);
  const { data: currentUser } = useCurrentUser();
  const updateAlbum = useUpdateAlbum(id);
  const deleteAlbum = useDeleteAlbum();
  const deletePhoto = useDeletePhoto(id);

  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const album = data?.album;
  const photos = data?.photos ?? [];

  const isOwner = currentUser?.id === album?.createdBy;
  const isAdmin = currentUser?.role === "admin";
  const canManage = isOwner || isAdmin;

  const canDeletePhoto = (photo: { uploaderId: string }) =>
    currentUser?.id === photo.uploaderId || isAdmin;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !album) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/gallery")}
        >
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          갤러리로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-8 text-center text-sm text-error">
          앨범을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    updateAlbum.mutate(
      { title: editTitle.trim(), description: editDesc.trim() || undefined },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm("이 앨범을 삭제하시겠습니까? 모든 사진이 함께 삭제됩니다."))
      return;
    deleteAlbum.mutate(id, {
      onSuccess: () => router.push("/gallery"),
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    deletePhoto.mutate(photoId, {
      onSuccess: () => {
        // Adjust lightbox index if needed
        if (lightboxIndex !== null) {
          if (photos.length <= 1) {
            setLightboxIndex(null);
          } else if (lightboxIndex >= photos.length - 1) {
            setLightboxIndex(photos.length - 2);
          }
        }
      },
    });
  };

  const openEditDialog = () => {
    setEditTitle(album.title);
    setEditDesc(album.description ?? "");
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/gallery")}
      >
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        갤러리로
      </Button>

      {/* Album info */}
      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-lg font-semibold text-text-strong">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-sm text-text-muted">{album.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{album.creatorName ?? "알 수 없음"}</span>
              <span>&middot;</span>
              <span>{formatDate(album.createdAt)}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Camera className="size-3" />
                {photos.length}장
              </span>
            </div>
          </div>

          {/* Owner/admin actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload((v) => !v)}
            >
              <Upload data-icon="inline-start" className="size-3.5" />
              {showUpload ? "닫기" : "사진 업로드"}
            </Button>
            {canManage && (
              <>
                {/* Edit dialog */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={openEditDialog}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>앨범 수정</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">앨범 제목 *</Label>
                        <Input
                          id="edit-title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-desc">설명 (선택)</Label>
                        <Textarea
                          id="edit-desc"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose render={<Button variant="outline" />}>
                          취소
                        </DialogClose>
                        <Button
                          type="submit"
                          disabled={
                            !editTitle.trim() || updateAlbum.isPending
                          }
                        >
                          {updateAlbum.isPending ? "수정 중..." : "수정"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="icon-sm"
                  onClick={handleDelete}
                  disabled={deleteAlbum.isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
          <PhotoUpload
            albumId={id}
            onUploadComplete={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* Photo grid */}
      <PhotoGrid
        photos={photos}
        onPhotoClick={(index) => setLightboxIndex(index)}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          onDelete={handleDeletePhoto}
          canDelete={canDeletePhoto}
        />
      )}
    </div>
  );
}
