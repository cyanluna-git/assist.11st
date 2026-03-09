"use client";

import { useState } from "react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format-date";
import { NewsCommentSection } from "@/components/news/news-comment-section";
import type { NewsArticle } from "@/types/news";

interface NewsCardProps {
  article: NewsArticle;
  currentUserId?: string;
}

export function NewsCard({ article, currentUserId }: NewsCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-4">
        {/* Source badge + time */}
        <div className="flex items-center gap-2">
          <Badge variant="muted">{article.sourceName ?? "공유"}</Badge>
          {article.publishedAt && (
            <span className="text-xs text-text-muted">
              {formatDate(article.publishedAt)}
            </span>
          )}
        </div>

        {/* Title as external link */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-start gap-1.5 group"
        >
          <h3 className="text-sm font-medium text-text-strong group-hover:text-brand transition-colors line-clamp-2">
            {article.title}
          </h3>
          <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors" />
        </a>

        {/* Summary */}
        {article.summary && (
          <p className="mt-1.5 text-xs text-text-muted line-clamp-2">
            {article.summary}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center">
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-strong transition-colors"
          >
            <MessageCircle className="size-3.5" />
            <span>댓글 {article.commentCount > 0 ? `(${article.commentCount})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Inline comments */}
      {showComments && (
        <div className="border-t px-4 py-3">
          <NewsCommentSection
            articleId={article.id}
            currentUserId={currentUserId}
          />
        </div>
      )}
    </div>
  );
}
