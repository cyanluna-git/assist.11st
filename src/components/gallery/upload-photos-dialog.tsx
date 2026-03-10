"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useUploadPhotosStandalone } from "@/hooks/use-gallery";

const MAX_FILES = 20;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface FilePreview {
  file: File;
  preview: string;
  caption: string;
}

export function UploadPhotosDialog() {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, isPending, progress } = useUploadPhotosStandalone();

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);
      const incoming = Array.from(newFiles);

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
        valid.push({
          file,
          preview: URL.createObjectURL(file),
          caption: "",
        });
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

  const updateCaption = (index: number, caption: string) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, caption } : f)),
    );
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

    // Build captions map
    const captions: Record<string, string> = {};
    files.forEach((fp) => {
      if (fp.caption.trim()) {
        captions[fp.file.name] = fp.caption.trim();
      }
    });

    upload(
      {
        files: files.map((fp) => fp.file),
        captions: Object.keys(captions).length > 0 ? captions : undefined,
      },
      {
        onSuccess: () => {
          files.forEach((f) => URL.revokeObjectURL(f.preview));
          setFiles([]);
          setOpen(false);
        },
        onError: (err) => {
          setError(err.message || "업로드에 실패했습니다.");
        },
      },
    );
  };

  const resetState = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <Camera data-icon="inline-start" className="size-3.5" />
            사진 올리기
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>사진 올리기</DialogTitle>
          <DialogDescription>
            사진을 선택하고 캡션을 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
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
              JPG, PNG, GIF, WebP &middot; 최대 {MAX_SIZE_MB}MB &middot;{" "}
              {MAX_FILES}장
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
          {error && <p className="text-sm text-error">{error}</p>}

          {/* File previews with captions */}
          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((fp, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-2"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={fp.preview}
                      alt={fp.file.name}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-xs text-text-muted">
                      {fp.file.name}
                    </p>
                    <Input
                      value={fp.caption}
                      onChange={(e) => updateCaption(i, e.target.value)}
                      placeholder="캡션 (선택)"
                      className="h-8 text-xs"
                      maxLength={500}
                      disabled={isPending}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {isPending && (
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-text-muted">
                {progress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose
            render={<Button variant="ghost" disabled={isPending} />}
          >
            취소
          </DialogClose>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isPending}
          >
            {isPending
              ? "업로드 중..."
              : `업로드${files.length > 0 ? ` (${files.length}장)` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
