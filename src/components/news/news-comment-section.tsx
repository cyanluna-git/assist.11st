"use client";

import { useState } from "react";
import { Reply } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNewsComments, useCreateNewsComment } from "@/hooks/use-news";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { NewsComment } from "@/types/news";

interface NewsCommentSectionProps {
  articleId: string;
  currentUserId?: string;
}

export function NewsCommentSection({
  articleId,
  currentUserId,
}: NewsCommentSectionProps) {
  const [content, setContent] = useState("");
  const { data: comments, isLoading } = useNewsComments(articleId);
  const createComment = useCreateNewsComment(articleId);

  const handleSubmit = () => {
    if (!content.trim()) return;
    createComment.mutate(
      { content },
      { onSuccess: () => setContent("") },
    );
  };

  const topLevel = (comments ?? []).filter((c) => !c.parentId);
  const replies = (comments ?? []).reduce<Record<string, NewsComment[]>>(
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
    <div className="space-y-3">
      {/* Input */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요..."
          className="min-h-[60px]"
        />
        <div className="flex justify-end">
          <Button
            size="xs"
            onClick={handleSubmit}
            disabled={!content.trim() || createComment.isPending}
          >
            댓글 작성
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="py-2 text-center text-xs text-text-muted">
          댓글을 불러오는 중...
        </div>
      )}

      {topLevel.length > 0 && (
        <div className="divide-y divide-foreground/5">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <NewsCommentItem
                comment={comment}
                articleId={articleId}
                currentUserId={currentUserId}
              />
              {replies[comment.id]?.map((reply) => (
                <NewsCommentItem
                  key={reply.id}
                  comment={reply}
                  articleId={articleId}
                  currentUserId={currentUserId}
                  isReply
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && topLevel.length === 0 && (
        <div className="py-2 text-center text-xs text-text-muted">
          아직 댓글이 없습니다.
        </div>
      )}
    </div>
  );
}

// ── Inline comment item ──

function NewsCommentItem({
  comment,
  articleId,
  isReply = false,
}: {
  comment: NewsComment;
  articleId: string;
  currentUserId?: string;
  isReply?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const createComment = useCreateNewsComment(articleId);

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

  return (
    <div className={cn("py-2", isReply && "ml-8 border-l-2 border-muted pl-3")}>
      <div className="flex items-start gap-2">
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
          <p className="mt-0.5 text-sm text-text-strong whitespace-pre-wrap">
            {comment.content}
          </p>
          {!isReply && (
            <button
              type="button"
              onClick={() => setReplying(!replying)}
              className="mt-1 flex items-center gap-1 text-xs text-text-muted hover:text-text-strong"
            >
              <Reply className="size-3" />
              답글
            </button>
          )}
        </div>
      </div>

      {replying && (
        <div className="ml-10 mt-2 space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 입력하세요..."
            className="min-h-[50px]"
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
