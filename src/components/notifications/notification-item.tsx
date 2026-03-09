"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, Reply, Megaphone, BarChart3, CalendarClock } from "lucide-react";
import type { Notification, NotificationType } from "@/types/notification";

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

const TYPE_ICONS: Record<NotificationType, typeof MessageSquare> = {
  comment: MessageSquare,
  reply: Reply,
  notice: Megaphone,
  poll: BarChart3,
  event_reminder: CalendarClock,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  compact = false,
}: NotificationItemProps) {
  const router = useRouter();
  const Icon = TYPE_ICONS[notification.type] ?? MessageSquare;

  function handleClick() {
    if (!notification.isRead && onMarkRead) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-lg px-3 text-left transition-colors hover:bg-canvas ${
        compact ? "py-2.5" : "py-3"
      } ${!notification.isRead ? "bg-brand/5" : ""}`}
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="size-4 text-text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={`text-sm leading-snug ${
              notification.isRead ? "text-text-muted" : "text-text-strong font-medium"
            } ${compact ? "line-clamp-2" : ""}`}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
          )}
        </div>
        {notification.message && !compact && (
          <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
            {notification.message}
          </p>
        )}
        <p className="mt-1 text-xs text-text-subtle">
          {getRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
