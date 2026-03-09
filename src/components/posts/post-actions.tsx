"use client";

import { useRouter } from "next/navigation";
import { Heart, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToggleReaction, useDeletePost } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";

interface PostActionsProps {
  postId: string;
  liked: boolean;
  reactionCount: number;
  canEdit: boolean;
}

export function PostActions({
  postId,
  liked,
  reactionCount,
  canEdit,
}: PostActionsProps) {
  const router = useRouter();
  const toggleReaction = useToggleReaction(postId);
  const deletePost = useDeletePost();

  const handleDelete = () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    deletePost.mutate(postId, {
      onSuccess: () => router.push("/posts"),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleReaction.mutate()}
        disabled={toggleReaction.isPending}
      >
        <Heart
          data-icon="inline-start"
          className={cn(
            "size-3.5",
            liked && "fill-error text-error",
          )}
        />
        {Number(reactionCount) || 0}
      </Button>

      {canEdit && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/posts/${postId}/edit`)}
          >
            <Pencil data-icon="inline-start" className="size-3.5" />
            수정
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deletePost.isPending}
          >
            <Trash2 data-icon="inline-start" className="size-3.5" />
            삭제
          </Button>
        </>
      )}
    </div>
  );
}
