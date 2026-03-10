import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type BookmarkTargetType = "post" | "news" | "thesis";

export interface BookmarkItem {
  id: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  title: string;
  url: string;
  boardType: string | null;
  field?: string | null;
  status?: string | null;
}

// ── useBookmarks ────────────────────────────────────────────────────────────
// Fetches the current user's bookmarks, optionally filtered by targetType.

export function useBookmarks(targetType?: BookmarkTargetType) {
  return useQuery<BookmarkItem[]>({
    queryKey: ["bookmarks", targetType ?? "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (targetType) params.set("target_type", targetType);
      const res = await fetch(`/api/bookmarks?${params}`);
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      const data = await res.json();
      return data.bookmarks as BookmarkItem[];
    },
  });
}

// ── useBookmarkCheck ────────────────────────────────────────────────────────
// Checks whether the current user has bookmarked a specific item.

export function useBookmarkCheck(
  targetType: BookmarkTargetType,
  targetId: string,
) {
  return useQuery<{ bookmarked: boolean; bookmarkId: string | null }>({
    queryKey: ["bookmark-check", targetType, targetId],
    queryFn: async () => {
      const params = new URLSearchParams({ targetType, targetId });
      const res = await fetch(`/api/bookmarks/check?${params}`);
      if (!res.ok) throw new Error("Failed to check bookmark");
      return res.json();
    },
    enabled: !!targetType && !!targetId,
  });
}

// ── useToggleBookmark ───────────────────────────────────────────────────────
// Toggles (add/remove) a bookmark. Performs an optimistic update on the
// bookmark-check query and invalidates the bookmarks list on settle.

export function useToggleBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetType,
      targetId,
      currentlyBookmarked,
    }: {
      targetType: BookmarkTargetType;
      targetId: string;
      currentlyBookmarked: boolean;
    }) => {
      if (currentlyBookmarked) {
        const params = new URLSearchParams({ targetType, targetId });
        const res = await fetch(`/api/bookmarks?${params}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove bookmark");
        return res.json() as Promise<{ bookmarked: boolean }>;
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }),
        });
        if (!res.ok) throw new Error("Failed to add bookmark");
        return res.json() as Promise<{
          bookmarked: boolean;
          bookmarkId: string;
        }>;
      }
    },

    onMutate: async ({ targetType, targetId, currentlyBookmarked }) => {
      const checkKey = ["bookmark-check", targetType, targetId];
      await queryClient.cancelQueries({ queryKey: checkKey });

      const previous = queryClient.getQueryData(checkKey);

      // Optimistically flip the bookmarked state
      queryClient.setQueryData(checkKey, {
        bookmarked: !currentlyBookmarked,
        bookmarkId: null,
      });

      return { previous, checkKey };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.checkKey, context.previous);
      }
    },

    onSettled: (_data, _err, { targetType }) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({
        queryKey: ["bookmark-check", targetType],
      });
    },
  });
}
