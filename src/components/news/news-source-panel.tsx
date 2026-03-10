"use client";

import { Rss } from "lucide-react";
import { useNewsSources, useToggleNewsSubscription } from "@/hooks/use-news";
import { cn } from "@/lib/utils";

export function NewsSourcePanel() {
  const { data: sources } = useNewsSources();
  const toggleMutation = useToggleNewsSubscription();

  if (!sources || sources.length === 0) return null;

  const hasAnySubscription = sources.some((s) => s.isSubscribed);

  return (
    <div className="rounded-xl border border-line-subtle bg-canvas p-4">
      <div className="mb-3 flex items-center gap-2">
        <Rss className="size-3.5 text-brand" />
        <p className="text-xs font-semibold text-text-strong">RSS 구독 관리</p>
        {hasAnySubscription && (
          <span className="ml-auto text-[10px] text-text-muted">
            구독 중인 소스만 표시됩니다
          </span>
        )}
        {!hasAnySubscription && (
          <span className="ml-auto text-[10px] text-text-muted">
            구독 없음 — 전체 소스 표시 중
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-text-strong">{source.name}</p>
              {source.category && (
                <p className="text-[11px] text-text-muted">{source.category}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({
                  sourceId: source.id,
                  subscribed: source.isSubscribed,
                })
              }
              disabled={toggleMutation.isPending}
              className={cn(
                "shrink-0 rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                source.isSubscribed
                  ? "bg-brand/10 text-brand hover:bg-brand/20"
                  : "border border-input text-text-muted hover:bg-muted",
              )}
            >
              {source.isSubscribed ? "구독 중" : "구독"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
