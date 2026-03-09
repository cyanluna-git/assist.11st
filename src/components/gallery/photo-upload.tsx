"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadPhotos } from "@/hooks/use-gallery";

const MAX_FILES = 20;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface FilePreview {
  file: File;
  preview: string;
}

interface PhotoUploadProps {
  albumId: string;
  onUploadComplete?: () => void;
}

export function PhotoUpload({ albumId, onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending, progress } = useUploadPhotos(albumId);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(newFiles);

      // Validate file count
      if (files.length + incoming.length > MAX_FILES) {
        setError(`최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
        return;
      }

      const valid: FilePreview[] = [];
      for (const file of incoming) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError("JPG, PNG, GIF, WebP 파일만 업로드할 수 있습니다.");
          continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
          continue;
        }
        valid.push({ file, preview: URL.createObjectURL(file) });
      }

      setFiles((prev) => [...prev, ...valid]);
    },
    [files.length],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    upload(
      files.map((f) => f.file),
      {
        onSuccess: () => {
          files.forEach((f) => URL.revokeObjectURL(f.preview));
          setFiles([]);
          onUploadComplete?.();
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-brand bg-brand/5"
            : "border-foreground/15 hover:border-foreground/30"
        }`}
      >
        <Upload className="size-8 text-text-muted" />
        <p className="text-sm text-text-muted">
          사진을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-text-muted">
          JPG, PNG, GIF, WebP &middot; 최대 {MAX_SIZE_MB}MB &middot; {MAX_FILES}장
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-6">
            {files.map((fp, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img
                  src={fp.preview}
                  alt={fp.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {isPending && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-text-muted text-center">{progress}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {files.length}장 선택됨
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  files.forEach((f) => URL.revokeObjectURL(f.preview));
                  setFiles([]);
                }}
                disabled={isPending}
              >
                전체 취소
              </Button>
              <Button size="sm" onClick={handleUpload} disabled={isPending}>
                {isPending ? "업로드 중..." : "업로드"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
