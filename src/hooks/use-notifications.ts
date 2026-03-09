import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  Notification,
  NotificationType,
  NotificationSettings,
} from "@/types/notification";

// ── Unread Count (polls every 30s) ──

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ["notifications", "unreadCount"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?unread=true&limit=0");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const data = await res.json();
      return data.unreadCount as number;
    },
    refetchInterval: 30_000,
  });
}

// ── Notifications List (for dropdown, limit=5) ──

export function useNotifications(limit = 5, offset = 0) {
  return useQuery<{ notifications: Notification[]; unreadCount: number }>({
    queryKey: ["notifications", "list", limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });
}

// ── Infinite Scroll (pages of 20) ──

const PAGE_SIZE = 20;

export function useNotificationsInfinite() {
  return useInfiniteQuery<{
    notifications: Notification[];
    unreadCount: number;
  }>({
    queryKey: ["notifications", "infinite"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(pageParam),
      });
      const res = await fetch(`/api/notifications?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.notifications.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
  });
}

// ── Mark Single Read ──

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Mark All Read ──

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// ── Notification Settings ──

export function useNotificationSettings() {
  return useQuery<NotificationSettings>({
    queryKey: ["notifications", "settings"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/settings");
      if (!res.ok) throw new Error("Failed to fetch notification settings");
      const data = await res.json();
      return data.settings as NotificationSettings;
    },
  });
}

// ── Toggle Notification Setting (optimistic) ──

export function useToggleNotificationSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { type: NotificationType; enabled: boolean }) => {
      const res = await fetch("/api/notifications/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to toggle notification setting");
      return res.json();
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "settings"],
      });

      const prev = queryClient.getQueryData<NotificationSettings>([
        "notifications",
        "settings",
      ]);

      queryClient.setQueryData<NotificationSettings>(
        ["notifications", "settings"],
        (old) => {
          if (!old) return old;
          return { ...old, [payload.type]: payload.enabled };
        },
      );

      return { prev };
    },
    onError: (_err, _payload, context) => {
      if (context?.prev) {
        queryClient.setQueryData(
          ["notifications", "settings"],
          context.prev,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "settings"],
      });
    },
  });
}
