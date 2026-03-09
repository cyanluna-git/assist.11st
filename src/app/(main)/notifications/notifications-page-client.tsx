"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotificationsInfinite,
  useMarkRead,
  useMarkAllRead,
} from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";

export function NotificationsPageClient() {
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotificationsInfinite();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const unreadCount = data?.pages[0]?.unreadCount ?? 0;
  const allNotifications =
    data?.pages.flatMap((page) => page.notifications) ?? [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-strong">알림</h1>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="size-4" />
            <span>모두 읽음</span>
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-text-subtle" />
        </div>
      ) : allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="size-12 text-text-subtle" />
          <p className="mt-4 text-sm text-text-muted">알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {allNotifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-text-subtle" />
            </div>
          )}

          {!hasNextPage && allNotifications.length > 0 && (
            <p className="py-4 text-center text-xs text-text-subtle">
              모든 알림을 확인했습니다
            </p>
          )}
        </div>
      )}
    </div>
  );
}
