"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LunchErrorCode,
  LunchListResponse,
  LunchRecommendation,
  LunchReview,
  LunchVisitStatus,
} from "@/types/lunch";

export class LunchApiError extends Error {
  code: LunchErrorCode | "unknown";
  retryable: boolean;
  status: number;

  constructor(
    message: string,
    code: LunchErrorCode | "unknown",
    retryable: boolean,
    status: number,
  ) {
    super(message);
    this.name = "LunchApiError";
    this.code = code;
    this.retryable = retryable;
    this.status = status;
  }
}

async function readLunchApiError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  throw new LunchApiError(
    data.error || fallback,
    data.errorCode || "unknown",
    data.retryable ?? false,
    res.status,
  );
}

export function useLunchPlaces() {
  return useQuery<LunchListResponse>({
    queryKey: ["lunch-places"],
    queryFn: async () => {
      const res = await fetch("/api/lunch");
      if (!res.ok) await readLunchApiError(res, "Failed to fetch lunch places");
      return res.json();
    },
  });
}

export function useLunchRecommendation() {
  return useQuery<LunchRecommendation | null>({
    queryKey: ["lunch-recommendation"],
    queryFn: async () => {
      const res = await fetch("/api/lunch/recommendation");
      if (!res.ok) {
        await readLunchApiError(res, "Failed to fetch lunch recommendation");
      }
      const data = await res.json();
      return data.recommendation ?? null;
    },
  });
}

export function useLunchReviews(placeId?: string) {
  return useQuery<LunchReview[]>({
    queryKey: ["lunch-reviews", placeId],
    enabled: Boolean(placeId),
    queryFn: async () => {
      const res = await fetch(`/api/lunch/reviews?placeId=${encodeURIComponent(placeId ?? "")}`);
      if (!res.ok) await readLunchApiError(res, "Failed to fetch lunch reviews");
      const data = await res.json();
      return data.reviews as LunchReview[];
    },
  });
}

export function useSaveLunchVisitState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { placeId: string; status: LunchVisitStatus }) => {
      const res = await fetch("/api/lunch/visit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await readLunchApiError(res, "Failed to save lunch visit state");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lunch-places"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-recommendation"] });
    },
  });
}

export function useUploadLunchReviewImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload lunch review image");
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}

export function useCreateLunchReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      placeId: string;
      content: string;
      photoUrls?: string[];
    }) => {
      const res = await fetch("/api/lunch/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await readLunchApiError(res, "Failed to create lunch review");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lunch-places"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-recommendation"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-reviews", variables.placeId] });
    },
  });
}

export function useUpdateLunchReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      reviewId: string;
      placeId: string;
      content: string;
      photoUrls?: string[];
    }) => {
      const res = await fetch(`/api/lunch/reviews/${payload.reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: payload.content,
          photoUrls: payload.photoUrls ?? [],
        }),
      });
      if (!res.ok) {
        await readLunchApiError(res, "Failed to update lunch review");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lunch-places"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-recommendation"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-reviews", variables.placeId] });
    },
  });
}

export function useDeleteLunchReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { reviewId: string; placeId: string }) => {
      const res = await fetch(`/api/lunch/reviews/${payload.reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        await readLunchApiError(res, "Failed to delete lunch review");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lunch-places"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-recommendation"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-reviews", variables.placeId] });
    },
  });
}
