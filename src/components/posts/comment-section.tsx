"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "@/components/posts/comment-item";
import { useComments, useCreateComment } from "@/hooks/use-posts";
import type { Comment } from "@/types/post";

interface CommentSectionProps {
  postId: string;
  currentUserId?: string;
  currentUserRole?: string;
}

export function CommentSection({
  postId,
  currentUserId,
  currentUserRole,
}: CommentSectionProps) {
  const [content, setContent] = useState("");
  const { data: comments, isLoading } = useComments(postId);
  const createComment = useCreateComment(postId);

  const handleSubmit = () => {
    if (!content.trim()) return;
    createComment.mutate(
      { content },
      {
        onSuccess: () => setContent(""),
      },
    );
  };

  // Group: top-level comments with their replies
  const topLevel = (comments ?? []).filter((c) => !c.parentId);
  const replies = (comments ?? []).reduce<Record<string, Comment[]>>(
    (acc, c) => {
      if (c.parentId) {
        if (!acc[c.parentId]) acc[c.parentId] = [];
        acc[c.parentId].push(c);
      }
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-text-strong">
        댓글 {comments ? `(${comments.length})` : ""}
      </h3>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || createComment.isPending}
          >
            댓글 작성
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="py-4 text-center text-sm text-text-muted">
          댓글을 불러오는 중...
        </div>
      )}

      {topLevel.length > 0 && (
        <div className="divide-y divide-foreground/5">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
              />
              {replies[comment.id]?.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isReply
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && topLevel.length === 0 && (
        <div className="py-4 text-center text-sm text-text-muted">
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </div>
      )}
    </div>
  );
}
