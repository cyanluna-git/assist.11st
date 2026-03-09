import { useQuery } from "@tanstack/react-query";
import type { PostSummary } from "@/types/post";

interface DashboardData {
  notices: PostSummary[];
  recentPosts: PostSummary[];
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    staleTime: 60_000,
  });
}
