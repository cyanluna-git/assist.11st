"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { useCreatePoll } from "@/hooks/use-polls";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 20;

export function CreatePollDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultiple, setIsMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const createPoll = useCreatePoll();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOptions(["", ""]);
    setIsMultiple(false);
    setIsAnonymous(false);
    setClosesAt("");
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const validOptions = options.filter((o) => o.trim().length > 0);
  const canSubmit = title.trim().length > 0 && validOptions.length >= MIN_OPTIONS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    createPoll.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions.map((o) => o.trim()),
        isMultiple,
        isAnonymous,
        closesAt: closesAt || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
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
            투표 만들기
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 투표 만들기</DialogTitle>
          <DialogDescription>
            투표를 만들고 원우들의 의견을 모아보세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="poll-title">제목 *</Label>
            <Input
              id="poll-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="투표 제목을 입력하세요"
              maxLength={200}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="poll-desc">설명 (선택)</Label>
            <Textarea
              id="poll-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="투표에 대한 설명을 입력하세요"
              rows={2}
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <Label>선택지 * (최소 {MIN_OPTIONS}개, 최대 {MAX_OPTIONS}개)</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`선택지 ${index + 1}`}
                  />
                  {options.length > MIN_OPTIONS && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="size-3.5 text-text-muted" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < MAX_OPTIONS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                className="w-full"
              >
                <Plus data-icon="inline-start" className="size-3.5" />
                선택지 추가
              </Button>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isMultiple}
                onChange={(e) => setIsMultiple(e.target.checked)}
                className="size-4 rounded border-border accent-brand"
              />
              <span className="text-text-default">복수 선택 허용</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-4 rounded border-border accent-brand"
              />
              <span className="text-text-default">익명 투표</span>
            </label>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="poll-deadline">마감일 (선택)</Label>
            <Input
              id="poll-deadline"
              type="datetime-local"
              value={closesAt}
              onChange={(e) => setClosesAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {createPoll.isError && (
            <p className="text-xs text-error">{createPoll.error.message}</p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" />}>
              취소
            </DialogClose>
            <Button
              type="submit"
              disabled={!canSubmit || createPoll.isPending}
            >
              {createPoll.isPending ? "생성 중..." : "만들기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
