"use client";

import { useState } from "react";
import { Reply, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateComment, useDeleteComment } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/post";
import { formatDate } from "@/lib/format-date";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  currentUserId,
  currentUserRole,
  isReply = false,
}: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);

  const canDelete =
    currentUserId === comment.authorId || currentUserRole === "admin";

  const handleReply = () => {
    if (!replyContent.trim()) return;
    createComment.mutate(
      { content: replyContent, parentId: comment.id },
      {
        onSuccess: () => {
          setReplyContent("");
          setReplying(false);
        },
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    deleteComment.mutate(comment.id);
  };

  return (
    <div className={cn("py-3", isReply && "ml-8 border-l-2 border-muted pl-4")}>
      <div className="flex items-start gap-2.5">
        <Avatar
          src={comment.authorAvatar}
          name={comment.authorName || "?"}
          size="sm"
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-text-strong">
              {comment.authorName || "알 수 없음"}
            </span>
            <span className="text-text-muted">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-text-strong whitespace-pre-wrap">
            {comment.content}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            {!isReply && (
              <button
                onClick={() => setReplying(!replying)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text-strong"
              >
                <Reply className="size-3" />
                답글
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                disabled={deleteComment.isPending}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-error"
              >
                <Trash2 className="size-3" />
                삭제
              </button>
            )}
          </div>
        </div>
      </div>

      {replying && (
        <div className="ml-10 mt-2 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요..."
            className="min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button
              size="xs"
              onClick={handleReply}
              disabled={!replyContent.trim() || createComment.isPending}
            >
              답글 작성
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setReplying(false);
                setReplyContent("");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
