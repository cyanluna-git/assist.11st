"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewItem } from "@/components/thesis/review-item";
import { ReviewForm } from "@/components/thesis/review-form";
import {
  useThesisReviews,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/use-theses";
import type { ThesisReview } from "@/types/thesis";

interface ReviewListProps {
  thesisId: string;
  currentUserId?: string;
}

export function ReviewList({ thesisId, currentUserId }: ReviewListProps) {
  const { data: reviews, isLoading } = useThesisReviews(thesisId);
  const createReview = useCreateReview(thesisId);
  const deleteReview = useDeleteReview(thesisId);
  const [editingReview, setEditingReview] = useState<ThesisReview | null>(null);

  const handleDelete = (reviewId: string) => {
    if (!confirm("리뷰를 삭제하시겠습니까?")) return;
    deleteReview.mutate(reviewId);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-text-strong">
        리뷰 ({reviews?.length ?? 0})
      </h2>

      {/* Write new review */}
      {currentUserId && !editingReview && (
        <div className="rounded-lg bg-card p-3 ring-1 ring-foreground/10">
          <ReviewForm
            onSubmit={(values) => {
              createReview.mutate(values);
            }}
            isPending={createReview.isPending}
          />
          {createReview.isError && (
            <p className="mt-2 text-sm text-error">
              {createReview.error.message}
            </p>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      )}

      {/* Review items */}
      {reviews && reviews.length === 0 && (
        <p className="py-4 text-center text-sm text-text-muted">
          아직 리뷰가 없습니다.
        </p>
      )}

      {reviews?.map((review) => {
        const isOwn =
          !!currentUserId && review.reviewer?.id === currentUserId;

        if (editingReview?.id === review.id) {
          return (
            <EditingReview
              key={review.id}
              thesisId={thesisId}
              review={review}
              onDone={() => setEditingReview(null)}
            />
          );
        }

        return (
          <ReviewItem
            key={review.id}
            review={review}
            isOwn={isOwn}
            onEdit={() => setEditingReview(review)}
            onDelete={() => handleDelete(review.id)}
          />
        );
      })}
    </div>
  );
}

function EditingReview({
  thesisId,
  review,
  onDone,
}: {
  thesisId: string;
  review: ThesisReview;
  onDone: () => void;
}) {
  const updateReview = useUpdateReview(thesisId, review.id);

  return (
    <div className="rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <ReviewForm
        initialRating={review.rating ?? 0}
        initialFeedback={review.feedback ?? ""}
        initialAnonymous={review.isAnonymous}
        submitLabel="수정"
        onCancel={onDone}
        onSubmit={(values) => {
          updateReview.mutate(values, { onSuccess: onDone });
        }}
        isPending={updateReview.isPending}
      />
    </div>
  );
}
