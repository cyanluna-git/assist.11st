"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/thesis/star-rating";
import { formatDate } from "@/lib/format-date";
import type { ThesisReview } from "@/types/thesis";

interface ReviewItemProps {
  review: ThesisReview;
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ReviewItem({
  review,
  isOwn,
  onEdit,
  onDelete,
}: ReviewItemProps) {
  const displayName = review.isAnonymous
    ? "익명"
    : review.reviewer?.name ?? "알 수 없음";
  const displayImage = review.isAnonymous ? null : review.reviewer?.image;

  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar
            src={displayImage}
            name={displayName}
            size="sm"
            className="!size-6 !text-[10px]"
          />
          <span className="text-xs font-medium text-text-strong">
            {displayName}
          </span>
          <span className="text-xs text-text-muted">
            {formatDate(review.createdAt)}
          </span>
        </div>
        {isOwn && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-xs" onClick={onEdit}>
              <Pencil className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onDelete}>
              <Trash2 className="size-3" />
            </Button>
          </div>
        )}
      </div>

      {review.rating != null && (
        <StarRating value={review.rating} readonly size="sm" />
      )}

      {review.feedback && (
        <p className="text-sm text-text-muted">{review.feedback}</p>
      )}
    </div>
  );
}
