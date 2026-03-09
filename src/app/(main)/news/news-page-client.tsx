"use client";

import { useState, useMemo, useCallback } from "react";
import { Loader2, Newspaper, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNews, useNewsSources } from "@/hooks/use-news";
import { NewsCard } from "@/components/news/news-card";
import { ShareNewsDialog } from "@/components/news/share-news-dialog";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

const PAGE_SIZE = 20;

interface NewsPageClientProps {
  currentUserId?: string;
}

export function NewsPageClient({ currentUserId }: NewsPageClientProps) {
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [searchInput, setSearchInput] = useState("");
  const [offset, setOffset] = useState(0);
  const debouncedSearch = useDebounce(searchInput, 300);

  const { data: sources } = useNewsSources();
  const { data: articles, isLoading, isError } = useNews(
    PAGE_SIZE,
    offset,
    sourceFilter,
    debouncedSearch || undefined,
  );

  const handleSourceChange = useCallback((source: string | undefined) => {
    setSourceFilter(source);
    setOffset(0);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
      setOffset(0);
    },
    [],
  );

  const hasMore = (articles?.length ?? 0) >= PAGE_SIZE;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">IT 소식</h1>
          <p className="mt-1 text-sm text-text-muted">
            최신 IT 뉴스와 기술 소식
          </p>
        </div>
        <ShareNewsDialog />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="뉴스 검색..."
          className="pl-8"
        />
      </div>

      {/* Source filter tabs */}
      {sources && sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSourceChange(undefined)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              sourceFilter === undefined
                ? "border-brand bg-brand/10 text-brand"
                : "border-input text-text-muted hover:bg-muted",
            )}
          >
            전체
          </button>
          {sources.map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() =>
                handleSourceChange(sourceFilter === src.id ? undefined : src.id)
              }
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                sourceFilter === src.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-input text-text-muted hover:bg-muted",
              )}
            >
              {src.name}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-text-muted" />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
          뉴스를 불러오는 중 오류가 발생했습니다.
        </div>
      )}

      {/* Article list */}
      {!isLoading && !isError && (
        <>
          {articles && articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-12 text-text-muted">
              <Newspaper className="size-10 opacity-40" />
              <p className="text-sm">등록된 소식이 없습니다</p>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {offset > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                이전
              </Button>
            )}
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                더 보기
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
