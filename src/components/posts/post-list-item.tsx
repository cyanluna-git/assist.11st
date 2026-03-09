"use client";

import Link from "next/link";
import { MessageSquare, Heart } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { PostSummary } from "@/types/post";
import { formatDate } from "@/lib/format-date";

interface PostListItemProps {
  post: PostSummary;
}

export function PostListItem({ post }: PostListItemProps) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-lg bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-text-strong">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">
            {post.content}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Avatar
                src={post.authorAvatar}
                name={post.authorName || "?"}
                size="sm"
                className="!size-5 !text-[10px]"
              />
              <span>{post.authorName || "알 수 없음"}</span>
            </div>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5" />
            {Number(post.reactionCount) || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {Number(post.commentCount) || 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
