"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useBookmarkCheck,
  useToggleBookmark,
  type BookmarkTargetType,
} from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  targetType: BookmarkTargetType;
  targetId: string;
  className?: string;
  showLabel?: boolean;
}

export function BookmarkButton({
  targetType,
  targetId,
  className,
  showLabel = false,
}: BookmarkButtonProps) {
  const { data, isLoading: isChecking } = useBookmarkCheck(targetType, targetId);
  const toggleBookmark = useToggleBookmark();

  const bookmarked = data?.bookmarked ?? false;
  const isPending = toggleBookmark.isPending;

  const handleClick = () => {
    if (isPending) return;
    toggleBookmark.mutate({ targetType, targetId, currentlyBookmarked: bookmarked });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending || isChecking}
      title={bookmarked ? "스크랩 해제" : "스크랩"}
      className={cn(
        "transition-colors",
        bookmarked ? "text-brand" : "text-text-muted hover:text-text-strong",
        className,
      )}
    >
      {bookmarked ? (
        <BookmarkCheck
          data-icon={showLabel ? "inline-start" : undefined}
          className={cn("size-4", bookmarked && "fill-brand/20")}
        />
      ) : (
        <Bookmark
          data-icon={showLabel ? "inline-start" : undefined}
          className="size-4"
        />
      )}
      {showLabel && (bookmarked ? "스크랩됨" : "스크랩")}
    </Button>
  );
}
