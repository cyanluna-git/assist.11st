"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BoardTabs } from "@/components/posts/board-tabs";
import type { BoardType } from "@/types/post";

interface PostFormProps {
  defaultValues?: {
    title: string;
    content: string;
    boardType: BoardType;
  };
  onSubmit: (values: {
    title: string;
    content: string;
    boardType: BoardType;
  }) => void;
  isPending: boolean;
  submitLabel: string;
  showBoardType?: boolean;
}

export function PostForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel,
  showBoardType = true,
}: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [content, setContent] = useState(defaultValues?.content ?? "");
  const [boardType, setBoardType] = useState<BoardType>(
    defaultValues?.boardType ?? "free",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content, boardType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {showBoardType && (
        <div className="space-y-2">
          <Label>게시판</Label>
          <BoardTabs value={boardType} onChange={setBoardType} />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          className="min-h-[200px]"
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || !title.trim() || !content.trim()}>
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  );
}
