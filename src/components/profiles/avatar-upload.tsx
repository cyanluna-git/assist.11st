"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export function AvatarUpload({
  src,
  name,
  isUploading,
  onUpload,
}: {
  src?: string | null;
  name: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <button
        type="button"
        disabled={isUploading}
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.click();
          }
        }}
        className="group relative cursor-pointer rounded-full p-1.5 transition-transform active:scale-[0.98] disabled:cursor-wait"
        aria-label="프로필 사진 업로드"
      >
        <div className="rounded-full ring-1 ring-line-subtle ring-offset-2 ring-offset-canvas transition-colors group-active:ring-brand/40 group-focus-visible:ring-brand/50">
          <Avatar src={src} name={name} size="lg" />
        </div>
        <div className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-white/70 bg-text-strong text-white shadow-sm">
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleChange}
      />
      <p className="text-xs text-text-subtle">아바타를 눌러 사진을 변경하세요</p>
    </div>
  );
}
