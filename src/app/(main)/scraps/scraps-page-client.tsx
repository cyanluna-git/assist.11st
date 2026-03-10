"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, ExternalLink, Loader2 } from "lucide-react";
import { BookmarkButton } from "@/components/bookmarks/bookmark-button";
import { useBookmarks, type BookmarkItem, type BookmarkTargetType } from "@/hooks/use-bookmarks";
import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";

const TABS: { label: string; value: "all" | BookmarkTargetType }[] = [
  { label: "전체", value: "all" },
  { label: "게시글", value: "post" },
  { label: "IT소식", value: "news" },
  { label: "논문", value: "thesis" },
];

const EMPTY_MESSAGES: Record<string, string> = {
  all: "아직 스크랩한 항목이 없습니다.",
  post: "스크랩한 게시글이 없습니다.",
  news: "스크랩한 IT소식이 없습니다.",
  thesis: "스크랩한 논문이 없습니다.",
};

function BookmarkList({
  targetType,
}: {
  targetType?: BookmarkTargetType;
}) {
  const { data: items, isLoading, isError } = useBookmarks(targetType);
  const tab = targetType ?? "all";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-error/20 bg-error/5 p-4 text-center text-sm text-error">
        스크랩 목록을 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
        <Bookmark className="size-10 opacity-30" />
        <p className="text-sm">{EMPTY_MESSAGES[tab]}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <BookmarkListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

function BookmarkListItem({ item }: { item: BookmarkItem }) {
  const isExternal = item.targetType === "news";

  const typeLabel =
    item.targetType === "post"
      ? "게시글"
      : item.targetType === "news"
        ? "IT소식"
        : "논문";

  return (
    <li className="flex items-start gap-3 rounded-lg border border-line-subtle bg-surface p-4 transition-colors hover:bg-canvas">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
            {typeLabel}
          </span>
          <span className="text-[11px] text-text-muted">
            {formatDate(item.createdAt)}
          </span>
        </div>

        {isExternal ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-1 text-sm font-medium text-text-strong transition-colors hover:text-brand"
          >
            <span className="line-clamp-2">{item.title}</span>
            <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-text-muted group-hover:text-brand" />
          </a>
        ) : (
          <Link
            href={item.url}
            className="line-clamp-2 text-sm font-medium text-text-strong transition-colors hover:text-brand"
          >
            {item.title}
          </Link>
        )}
      </div>

      <BookmarkButton
        targetType={item.targetType as BookmarkTargetType}
        targetId={item.targetId}
        className="shrink-0"
      />
    </li>
  );
}

export function ScrapsPageClient() {
  const [activeTab, setActiveTab] = useState<"all" | BookmarkTargetType>("all");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-text-strong">스크랩</h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-line-subtle bg-canvas p-1">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === value
                ? "bg-surface text-text-strong shadow-sm"
                : "text-text-muted hover:text-text-main",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <BookmarkList
        targetType={activeTab === "all" ? undefined : activeTab}
      />
    </div>
  );
}
