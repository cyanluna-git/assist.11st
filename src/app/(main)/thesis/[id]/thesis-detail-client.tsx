"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { StarRating } from "@/components/thesis/star-rating";
import { ThesisFileUpload } from "@/components/thesis/thesis-file-upload";
import { ReviewList } from "@/components/thesis/review-list";
import { BookmarkButton } from "@/components/bookmarks/bookmark-button";
import { useThesis, useDeleteThesis } from "@/hooks/use-theses";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format-date";
import { FIELD_MAP, STATUS_MAP } from "@/types/thesis";
import { cn } from "@/lib/utils";

export function ThesisDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: thesis, isLoading, isError } = useThesis(id);
  const { data: currentUser } = useCurrentUser();
  const deleteThesis = useDeleteThesis();

  const isAuthor = !!currentUser && thesis?.authorId === currentUser.id;

  const handleDelete = () => {
    if (!confirm("논문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;
    deleteThesis.mutate(id, {
      onSuccess: () => router.push("/thesis"),
    });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  // Error
  if (isError || !thesis) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/thesis")}
        >
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          논문을 불러오는 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  const field = thesis.field ? FIELD_MAP[thesis.field] : null;
  const status = STATUS_MAP[thesis.status];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/thesis")}
      >
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        목록으로
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-text-strong">
                {thesis.title}
              </h1>
              {field && (
                <Badge
                  variant="muted"
                  className={cn("text-[10px]", field.color, field.bg)}
                >
                  {field.label}
                </Badge>
              )}
              {status && (
                <Badge
                  variant="muted"
                  className={cn("text-[10px]", status.color, status.bg)}
                >
                  {status.label}
                </Badge>
              )}
            </div>
          </div>
          <BookmarkButton targetType="thesis" targetId={id} className="shrink-0" />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Avatar
            src={thesis.author.image}
            name={thesis.author.name}
            size="sm"
          />
          <span>{thesis.author.name}</span>
          <span>&middot;</span>
          <span>{formatDate(thesis.createdAt)}</span>
          <span>&middot;</span>
          <StarRating value={Math.round(thesis.avgRating)} readonly size="sm" />
          <span>({thesis.reviewCount})</span>
        </div>
      </div>

      {/* Abstract */}
      {thesis.abstract && (
        <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="mb-2 text-sm font-medium text-text-strong">초록</h2>
          <p className="whitespace-pre-wrap text-sm text-text-muted">
            {thesis.abstract}
          </p>
        </div>
      )}

      {/* File */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="mb-3 text-sm font-medium text-text-strong">파일</h2>
        <ThesisFileUpload
          thesisId={thesis.id}
          fileUrl={thesis.fileUrl}
          isAuthor={isAuthor}
        />
      </div>

      {/* Reviews */}
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <ReviewList thesisId={thesis.id} currentUserId={currentUser?.id} />
      </div>

      {/* Actions (author only) */}
      {isAuthor && (
        <div className="flex flex-wrap gap-2">
          <Link href={`/thesis/${thesis.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil data-icon="inline-start" className="size-3.5" />
              수정
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteThesis.isPending}
          >
            <Trash2 data-icon="inline-start" className="size-3.5" />
            {deleteThesis.isPending ? "삭제 중..." : "삭제"}
          </Button>
        </div>
      )}
    </div>
  );
}
