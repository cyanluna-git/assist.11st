"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PostActions } from "@/components/posts/post-actions";
import { CommentSection } from "@/components/posts/comment-section";
import { usePost } from "@/hooks/use-posts";
import { useCurrentUser } from "@/hooks/use-current-user";

const BOARD_LABELS: Record<string, string> = {
  notice: "공지",
  free: "자유",
  column: "칼럼",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: post, isLoading, isError } = usePost(id);
  const { data: currentUser } = useCurrentUser();

  const canEdit =
    currentUser?.id === post?.authorId || currentUser?.role === "admin";

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/posts")}>
          <ArrowLeft data-icon="inline-start" className="size-3.5" />
          목록으로
        </Button>
        <div className="rounded-lg border border-error/20 bg-error/5 p-8 text-center text-sm text-error">
          게시글을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/posts")}>
        <ArrowLeft data-icon="inline-start" className="size-3.5" />
        목록으로
      </Button>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{BOARD_LABELS[post.boardType] ?? post.boardType}</Badge>
          </div>

          <h1 className="text-lg font-semibold text-text-strong">{post.title}</h1>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Avatar
                src={post.authorAvatar}
                name={post.authorName || "?"}
                size="sm"
              />
              <span className="font-medium">{post.authorName || "알 수 없음"}</span>
            </div>
            <span>{formatDate(post.createdAt)}</span>
            {post.updatedAt !== post.createdAt && (
              <span className="text-text-muted">(수정됨)</span>
            )}
          </div>

          <div className="border-t border-foreground/5 pt-4">
            <div className="prose prose-sm max-w-none text-sm text-text-strong whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          <div className="border-t border-foreground/5 pt-4">
            <PostActions
              postId={post.id}
              liked={post.userHasLiked}
              reactionCount={post.reactionCount}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <CommentSection
          postId={post.id}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
        />
      </div>
    </div>
  );
}
