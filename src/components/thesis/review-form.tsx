"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "@/components/thesis/star-rating";

interface ReviewFormProps {
  onSubmit: (values: {
    rating: number;
    feedback?: string;
    isAnonymous?: boolean;
  }) => void;
  isPending?: boolean;
  initialRating?: number;
  initialFeedback?: string;
  initialAnonymous?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ReviewForm({
  onSubmit,
  isPending,
  initialRating = 0,
  initialFeedback = "",
  initialAnonymous = false,
  submitLabel = "리뷰 작성",
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [isAnonymous, setIsAnonymous] = useState(initialAnonymous);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    onSubmit({
      rating,
      feedback: feedback.trim() || undefined,
      isAnonymous,
    });
    if (!onCancel) {
      setRating(0);
      setFeedback("");
      setIsAnonymous(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">별점</span>
        <StarRating value={rating} onChange={setRating} />
      </div>

      <Textarea
        placeholder="피드백을 작성해주세요 (선택)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
      />

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="size-4 rounded border-input"
          />
          익명으로 작성
        </label>

        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={rating === 0 || isPending}
          >
            {isPending ? "저장 중..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
