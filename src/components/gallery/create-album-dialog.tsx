"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { useCreateAlbum } from "@/hooks/use-gallery";

export function CreateAlbumDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const createAlbum = useCreateAlbum();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createAlbum.mutate(
      { title: title.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" className="size-3.5" />
            앨범 만들기
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 앨범 만들기</DialogTitle>
          <DialogDescription>
            앨범을 만들고 사진을 업로드하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-title">앨범 제목 *</Label>
            <Input
              id="album-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="앨범 제목을 입력하세요"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="album-desc">설명 (선택)</Label>
            <Textarea
              id="album-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="앨범에 대한 설명을 입력하세요"
              rows={3}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              취소
            </DialogClose>
            <Button
              type="submit"
              disabled={!title.trim() || createAlbum.isPending}
            >
              {createAlbum.isPending ? "생성 중..." : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
