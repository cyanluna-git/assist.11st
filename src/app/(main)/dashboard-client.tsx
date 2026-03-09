"use client";

import { useDashboardData } from "@/hooks/use-dashboard";
import { NoticeBanner } from "@/components/dashboard/notice-banner";
import { RecentPostsWidget } from "@/components/dashboard/recent-posts-widget";
import { ScheduleWidget } from "@/components/dashboard/schedule-widget";
import { PollWidget } from "@/components/dashboard/poll-widget";
import { GalleryWidget } from "@/components/dashboard/gallery-widget";
import { NewsWidget } from "@/components/dashboard/news-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[58px] w-full" />
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[200px]" />
        ))}
      </div>
    </div>
  );
}

export function DashboardClient({ userName }: { userName: string }) {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-text-muted">데이터를 불러오지 못했습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-strong">
          안녕하세요, {userName}님
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          aSSiST 11기 커뮤니티에 오신 것을 환영합니다.
        </p>
      </div>

      {/* Notice Banner */}
      {data?.notices && <NoticeBanner notices={data.notices} />}

      {/* Quick Actions */}
      <QuickActions />

      {/* Widget Grid: 1-col mobile, 2-col tablet, 3-col desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Recent Posts spans full width on tablet, 2 cols on desktop */}
        <div className="sm:col-span-2">
          <RecentPostsWidget posts={data?.recentPosts ?? []} />
        </div>

        <ScheduleWidget />
        <PollWidget />
        <GalleryWidget />
        <NewsWidget />
      </div>
    </div>
  );
}
