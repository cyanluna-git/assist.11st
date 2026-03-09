"use client";

import Link from "next/link";
import { MessageSquare, Heart, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import type { PostSummary, BoardType } from "@/types/post";
import { formatDate } from "@/lib/format-date";

const boardTypeLabels: Record<BoardType, string> = {
  notice: "공지",
  free: "자유",
  column: "칼럼",
};

interface RecentPostsWidgetProps {
  posts: PostSummary[];
}

export function RecentPostsWidget({ posts }: RecentPostsWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>최신 게시글</CardTitle>
        <CardAction>
          <Link
            href="/posts"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-text-muted">
            아직 게시글이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-start gap-3 py-3 transition-colors hover:bg-canvas/50 first:pt-0 last:pb-0"
                >
                  <Avatar
                    src={post.authorAvatar}
                    name={post.authorName ?? "?"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="muted" className="shrink-0">
                        {boardTypeLabels[post.boardType]}
                      </Badge>
                      <span className="truncate text-sm font-medium text-text-strong">
                        {post.title}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                      <span>{post.authorName}</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="size-3" />
                        {post.reactionCount}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <MessageSquare className="size-3" />
                        {post.commentCount}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
