"use client";

import { useState } from "react";
import { useShareNews } from "@/hooks/use-news";
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
} from "@/components/ui/dialog";
import { LinkIcon } from "lucide-react";

export function ShareNewsDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const shareNews = useShareNews();

  const reset = () => {
    setTitle("");
    setUrl("");
    setSummary("");
  };

  const handleSubmit = () => {
    if (!title.trim() || !url.trim()) return;
    shareNews.mutate(
      { title: title.trim(), url: url.trim(), summary: summary.trim() || undefined },
      {
        onSuccess: () => {
          reset();
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
            <LinkIcon className="mr-1.5 size-3.5" />
            링크 공유
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>링크 공유</DialogTitle>
          <DialogDescription>
            IT 관련 기사나 블로그 링크를 공유해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="share-title">제목 *</Label>
            <Input
              id="share-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="기사 제목"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-url">URL *</Label>
            <Input
              id="share-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="share-summary">요약 (선택)</Label>
            <Textarea
              id="share-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="간단한 요약..."
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !url.trim() || shareNews.isPending}
          >
            {shareNews.isPending ? "공유 중..." : "공유하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
