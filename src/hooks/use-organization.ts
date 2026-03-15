"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrganizationData } from "@/types/organization";
import type { OrganizationRoleKey } from "@/lib/organization";

interface RolePayload {
  roleKey: OrganizationRoleKey;
  memberName: string;
  photoUrl: string | null;
}

export function useOrganization() {
  return useQuery<OrganizationData>({
    queryKey: ["organization"],
    queryFn: async () => {
      const res = await fetch("/api/organization");
      if (!res.ok) throw new Error("Failed to fetch organization data");
      return res.json();
    },
  });
}

export function useSaveOrganizationRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roles: RolePayload[]) => {
      const res = await fetch("/api/organization/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save roles");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function usePublishBylawVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { version: string; content: string }) => {
      const res = await fetch("/api/organization/bylaws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to publish bylaw");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
}

export function useUploadOrganizationImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to upload image");
      }
      return res.json() as Promise<{ url: string }>;
    },
  });
}
