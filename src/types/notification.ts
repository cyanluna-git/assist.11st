export type NotificationType =
  | "comment"
  | "reply"
  | "notice"
  | "poll"
  | "event_reminder";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  comment: boolean;
  reply: boolean;
  notice: boolean;
  poll: boolean;
  event_reminder: boolean;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  comment: "댓글",
  reply: "답글",
  notice: "공지",
  poll: "투표",
  event_reminder: "일정 알림",
};
