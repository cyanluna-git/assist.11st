import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NewsArticle, NewsSource, NewsComment } from "@/types/news";

// ── List News Articles ──

export function useNews(
  limit = 20,
  offset = 0,
  sourceId?: string,
  search?: string,
) {
  return useQuery<NewsArticle[]>({
    queryKey: ["news", limit, offset, sourceId, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (sourceId) params.set("sourceId", sourceId);
      if (search) params.set("search", search);
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      return data.articles;
    },
  });
}

// ── News Sources ──

export function useNewsSources() {
  return useQuery<NewsSource[]>({
    queryKey: ["newsSources"],
    queryFn: async () => {
      const res = await fetch("/api/news/sources");
      if (!res.ok) throw new Error("Failed to fetch news sources");
      const data = await res.json();
      return data.sources;
    },
    staleTime: 5 * 60_000,
  });
}

// ── News Comments ──

export function useNewsComments(articleId: string) {
  return useQuery<NewsComment[]>({
    queryKey: ["newsComments", articleId],
    queryFn: async () => {
      const res = await fetch(`/api/news/${articleId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      return data.comments;
    },
    enabled: !!articleId,
  });
}

// ── Create Comment ──

export function useCreateNewsComment(articleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; parentId?: string }) => {
      const res = await fetch(`/api/news/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsComments", articleId] });
      queryClient.invalidateQueries({ queryKey: ["news"] });
    },
  });
}

// ── Share News (manual link) ──

export function useShareNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      url: string;
      summary?: string;
    }) => {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to share news");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      queryClient.invalidateQueries({ queryKey: ["newsSources"] });
    },
  });
}
