"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardTabs } from "@/components/posts/board-tabs";
import { PostListItem } from "@/components/posts/post-list-item";
import { PostListSkeleton } from "@/components/posts/post-list-skeleton";
import { usePosts } from "@/hooks/use-posts";
import type { BoardType } from "@/types/post";

const PAGE_SIZE = 20;

export function PostsPageClient() {
  const [boardType, setBoardType] = useState<BoardType>("free");
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: posts, isLoading, isError } = usePosts(boardType, limit);

  const hasMore = (posts?.length ?? 0) >= limit;

  const handleLoadMore = () => {
    setLimit((prev) => prev + PAGE_SIZE);
  };

  const handleTabChange = (type: BoardType) => {
    setBoardType(type);
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">커뮤니티 게시판</h1>
          <p className="mt-1 text-sm text-text-muted">ASSIST 11기 커뮤니티</p>
        </div>
        <Link href="/posts/write">
          <Button size="sm">
            <Plus data-icon="inline-start" className="size-3.5" />
            글쓰기
          </Button>
        </Link>
      </div>

      <BoardTabs value={boardType} onChange={handleTabChange} />

      {isLoading && <PostListSkeleton />}

      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          게시글을 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {posts && posts.length === 0 && (
        <div className="rounded-lg bg-muted p-8 text-center text-sm text-text-muted">
          아직 작성된 게시글이 없습니다.
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostListItem key={post.id} post={post} />
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button variant="outline" size="sm" onClick={handleLoadMore}>
                더보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
