"use client";

import { useCallback, useRef } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadThesisFile, useDeleteThesisFile } from "@/hooks/use-theses";

interface ThesisFileUploadProps {
  thesisId: string;
  fileUrl: string | null;
  isAuthor: boolean;
}

export function ThesisFileUpload({
  thesisId,
  fileUrl,
  isAuthor,
}: ThesisFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: upload, progress, isPending } = useUploadThesisFile(thesisId);
  const deleteFile = useDeleteThesisFile(thesisId);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload],
  );

  const handleDeleteFile = () => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    deleteFile.mutate();
  };

  // Show existing file
  if (fileUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
        <FileText className="size-5 shrink-0 text-text-muted" />
        <span className="min-w-0 flex-1 truncate text-sm text-text-strong">
          논문 파일
        </span>
        <div className="flex gap-1">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon-xs">
              <Download className="size-3" />
            </Button>
          </a>
          {isAuthor && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleDeleteFile}
              disabled={deleteFile.isPending}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Upload zone (only for author)
  if (!isAuthor) return null;

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-foreground/10 p-6 text-center transition-colors hover:border-foreground/20"
    >
      <Upload className="size-6 text-text-muted" />
      <p className="text-sm text-text-muted">
        PDF 또는 DOCX 파일을 드래그하거나
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? `업로드 중... ${progress}%` : "파일 선택"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFileSelect}
        className="hidden"
      />
      {isPending && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
