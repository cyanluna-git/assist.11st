"use client";

import Link from "next/link";
import { Newspaper, ChevronRight, ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNews } from "@/hooks/use-news";
import { formatDate } from "@/lib/format-date";

export function NewsWidget() {
  const { data: articles, isLoading } = useNews(3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>IT 소식</CardTitle>
        <CardAction>
          <Link
            href="/news"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-brand" />
          </div>
        )}

        {!isLoading && (!articles || articles.length === 0) && (
          <div className="flex flex-col items-center gap-2 py-6 text-text-muted">
            <Newspaper className="size-8 opacity-40" />
            <p className="text-sm">등록된 소식이 없습니다</p>
          </div>
        )}

        {!isLoading && articles && articles.length > 0 && (
          <div className="space-y-3">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="muted" className="shrink-0 text-[9px]">
                      {article.sourceName ?? "공유"}
                    </Badge>
                    <span className="truncate text-sm font-medium text-text-strong group-hover:text-brand">
                      {article.title}
                    </span>
                    <ExternalLink className="size-3 shrink-0 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {article.publishedAt && (
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatDate(article.publishedAt)}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
