"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BabzipData, LunchPlace } from "@/types/lunch";

async function readBabzipError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || fallback);
}

export function useBabzipData() {
  return useQuery<BabzipData>({
    queryKey: ["babzip"],
    queryFn: async () => {
      const res = await fetch("/api/babzip");
      if (!res.ok) {
        await readBabzipError(res, "Failed to fetch babzip data");
      }
      return res.json();
    },
  });
}

export function useBabzipSearch(query: string) {
  return useQuery<{ places: LunchPlace[] }>({
    queryKey: ["babzip-search", query],
    enabled: query.trim().length > 0,
    queryFn: async () => {
      const res = await fetch(`/api/babzip/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        await readBabzipError(res, "Failed to search babzip places");
      }
      return res.json();
    },
  });
}

export function useToggleBabzipExclusion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      placeId: string;
      placeName: string;
      categoryName: string | null;
      roadAddressName: string | null;
      addressName: string | null;
      excluded: boolean;
    }) => {
      const res = await fetch("/api/babzip", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        await readBabzipError(res, "Failed to update babzip exclusion");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["babzip"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-places"] });
      queryClient.invalidateQueries({ queryKey: ["lunch-recommendation"] });
    },
  });
}
