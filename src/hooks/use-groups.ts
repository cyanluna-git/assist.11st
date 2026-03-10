import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GroupSummary, GroupDetail, GroupMember, GroupPost } from "@/types/group";
import type { EventSummary } from "@/types/event";

// ── List Groups ──

export function useGroups(category?: string) {
  return useQuery<GroupSummary[]>({
    queryKey: ["groups", "all", category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      const res = await fetch(`/api/groups?${params}`);
      if (!res.ok) throw new Error("Failed to fetch groups");
      const data = await res.json();
      return data.groups;
    },
    retry: 1,
  });
}

// ── Group Detail ──

export function useGroup(id: string) {
  return useQuery<GroupDetail>({
    queryKey: ["group", id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${id}`);
      if (!res.ok) throw new Error("Failed to fetch group");
      const data = await res.json();
      return data.group;
    },
    enabled: !!id,
  });
}

// ── Group Members ──

export function useGroupMembers(id: string) {
  return useQuery<GroupMember[]>({
    queryKey: ["group-members", id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${id}/members`);
      if (!res.ok) throw new Error("Failed to fetch group members");
      const data = await res.json();
      return data.members;
    },
    enabled: !!id,
  });
}

// ── Group Posts ──

export function useGroupPosts(id: string) {
  return useQuery<GroupPost[]>({
    queryKey: ["group-posts", id],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${id}/posts`);
      if (!res.ok) throw new Error("Failed to fetch group posts");
      const data = await res.json();
      return data.posts;
    },
    enabled: !!id,
  });
}

// ── Group Events ──

export function useGroupEvents(groupId: string, from: string, to: string) {
  return useQuery<EventSummary[]>({
    queryKey: ["events", from, to, undefined, groupId],
    queryFn: async () => {
      const params = new URLSearchParams({ from, to, group_id: groupId });
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch group events");
      const data = await res.json();
      return data.events;
    },
    enabled: !!groupId && !!from && !!to,
    retry: 1,
  });
}

// ── Join Group ──

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${id}/join`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to join group");
      }
      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["groups", "all"] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
    },
  });
}

// ── Leave Group ──

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/groups/${id}/leave`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave group");
      }
      return res.json();
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["groups", "all"] });
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", id] });
    },
  });
}

// ── Create Group ──

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      category?: string;
      maxMembers?: number;
      imageUrl?: string;
    }) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group");
      }
      return res.json() as Promise<{ group: GroupDetail }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", "all"] });
    },
  });
}

// ── Create Group Post ──

export function useCreateGroupPost(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { title: string; content: string }) => {
      const res = await fetch(`/api/groups/${groupId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create group post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-posts", groupId] });
    },
  });
}
