"use client";

import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNotifications, useMarkRead, useMarkAllRead } from "@/hooks/use-notifications";
import { NotificationItem } from "./notification-item";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data, isLoading } = useNotifications(5, 0);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  return (
    <div className="w-80 rounded-xl border border-line-subtle bg-surface shadow-lg sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-strong">알림</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 disabled:opacity-50"
          >
            <CheckCheck className="size-3.5" />
            모두 읽음
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-text-subtle" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="size-8 text-text-subtle" />
            <p className="mt-2 text-sm text-text-muted">알림이 없습니다</p>
          </div>
        ) : (
          <div className="p-1">
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onMarkRead={(id) => markRead.mutate(id)}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-line-subtle px-4 py-2.5">
          <Link
            href="/notifications"
            onClick={onClose}
            className="block text-center text-xs font-medium text-brand hover:text-brand/80"
          >
            모든 알림 보기
          </Link>
        </div>
      )}
    </div>
  );
}
