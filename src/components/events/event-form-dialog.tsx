"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
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
import { useCreateEvent, useUpdateEvent } from "@/hooks/use-events";
import { EVENT_CATEGORIES } from "@/types/event";
import type { EventSummary } from "@/types/event";
import { cn } from "@/lib/utils";

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormDialog({
  mode = "create",
  event,
  trigger,
}: {
  mode?: "create" | "edit";
  event?: EventSummary;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [category, setCategory] = useState("");

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(event?.id ?? "");

  useEffect(() => {
    if (mode === "edit" && event && open) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setLocation(event.location ?? "");
      setStartAt(toLocalDatetimeValue(event.startAt));
      setEndAt(event.endAt ? toLocalDatetimeValue(event.endAt) : "");
      setCategory(event.category ?? "");
    } else if (mode === "create" && open) {
      setTitle("");
      setDescription("");
      setLocation("");
      setStartAt("");
      setEndAt("");
      setCategory("");
    }
  }, [open, mode, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startAt) return;

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
      category: category || undefined,
    };

    if (mode === "edit" && event) {
      updateEvent.mutate(payload, {
        onSuccess: () => setOpen(false),
      });
    } else {
      createEvent.mutate(payload, {
        onSuccess: () => setOpen(false),
      });
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  const defaultTrigger =
    mode === "edit" ? (
      <Button size="xs" variant="ghost">
        <Pencil data-icon="inline-start" className="size-3" />
        수정
      </Button>
    ) : (
      <Button size="sm">
        <Plus data-icon="inline-start" className="size-3.5" />
        일정 만들기
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "일정 수정" : "새 일정 만들기"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "일정 정보를 수정하세요."
              : "새로운 일정을 등록하세요."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">제목 *</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              required
              autoFocus
              maxLength={200}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>카테고리</Label>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() =>
                    setCategory(category === cat.value ? "" : cat.value)
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    category === cat.value
                      ? `${cat.bg} ${cat.color} border-current`
                      : "border-input bg-background text-text-muted hover:bg-muted",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-start">시작 *</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-end">종료</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location">장소</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="장소를 입력하세요"
              maxLength={500}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">설명</Label>
            <Textarea
              id="event-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="일정에 대한 설명"
              rows={3}
              maxLength={5000}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              취소
            </DialogClose>
            <Button
              type="submit"
              disabled={!title.trim() || !startAt || isPending}
            >
              {isPending
                ? mode === "edit"
                  ? "수정 중..."
                  : "생성 중..."
                : mode === "edit"
                  ? "수정"
                  : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
