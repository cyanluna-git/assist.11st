import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type {
  ThesisSummary,
  ThesisDetail,
  ThesisReview,
} from "@/types/thesis";

// ── List Theses ──

export function useTheses(
  field?: string,
  status?: string,
  limit = 20,
  offset = 0,
) {
  return useQuery<ThesisSummary[]>({
    queryKey: ["theses", field, status, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (field) params.set("field", field);
      if (status) params.set("status", status);
      const res = await fetch(`/api/theses?${params}`);
      if (!res.ok) throw new Error("Failed to fetch theses");
      const data = await res.json();
      return data.theses;
    },
  });
}

// ── Thesis Detail ──

export function useThesis(id: string) {
  return useQuery<ThesisDetail>({
    queryKey: ["thesis", id],
    queryFn: async () => {
      const res = await fetch(`/api/theses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch thesis");
      const data = await res.json();
      return data.thesis;
    },
    enabled: !!id,
  });
}

// ── Create Thesis ──

export function useCreateThesis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      abstract?: string;
      field?: string;
    }) => {
      const res = await fetch("/api/theses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create thesis");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Update Thesis ──

export function useUpdateThesis(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title?: string;
      abstract?: string;
      field?: string;
      status?: string;
    }) => {
      const res = await fetch(`/api/theses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update thesis");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis", id] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Delete Thesis ──

export function useDeleteThesis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/theses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete thesis");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Upload Thesis File (XHR for progress) ──

export function useUploadThesisFile(thesisId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<{ fileUrl: string }>((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/theses/${thesisId}/upload`);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            try {
              const data = JSON.parse(xhr.responseText);
              reject(new Error(data.error || "Upload failed"));
            } catch {
              reject(new Error("Upload failed"));
            }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      setProgress(0);
      queryClient.invalidateQueries({ queryKey: ["thesis", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
    onError: () => {
      setProgress(0);
    },
  });

  return { ...mutation, progress };
}

// ── Delete Thesis File ──

export function useDeleteThesisFile(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/theses/${thesisId}/upload`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thesis", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Thesis Reviews ──

export function useThesisReviews(thesisId: string) {
  return useQuery<ThesisReview[]>({
    queryKey: ["thesisReviews", thesisId],
    queryFn: async () => {
      const res = await fetch(`/api/theses/${thesisId}/reviews`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      return data.reviews;
    },
    enabled: !!thesisId,
  });
}

// ── Create Review ──

export function useCreateReview(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rating: number;
      feedback?: string;
      isAnonymous?: boolean;
    }) => {
      const res = await fetch(`/api/theses/${thesisId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create review");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["thesisReviews", thesisId],
      });
      queryClient.invalidateQueries({ queryKey: ["thesis", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Update Review ──

export function useUpdateReview(thesisId: string, reviewId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      rating?: number;
      feedback?: string;
      isAnonymous?: boolean;
    }) => {
      const res = await fetch(`/api/theses/${thesisId}/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["thesisReviews", thesisId],
      });
      queryClient.invalidateQueries({ queryKey: ["thesis", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}

// ── Delete Review ──

export function useDeleteReview(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const res = await fetch(`/api/theses/${thesisId}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["thesisReviews", thesisId],
      });
      queryClient.invalidateQueries({ queryKey: ["thesis", thesisId] });
      queryClient.invalidateQueries({ queryKey: ["theses"] });
    },
  });
}
