"use client";

import { Users2 } from "lucide-react";
import { useGroups } from "@/hooks/use-groups";
import { GroupCard } from "./group-card";

interface GroupListProps {
  category?: string;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="h-28 w-full animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-4">
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-12 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function GroupList({ category }: GroupListProps) {
  const { data: groups, isLoading, isError } = useGroups(category);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-text-muted">
        <Users2 className="size-10 opacity-30" />
        <p className="text-sm">소모임을 불러올 수 없습니다</p>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-16 text-text-muted">
        <Users2 className="size-10 opacity-30" />
        <p className="text-sm">아직 소모임이 없습니다</p>
        <p className="text-xs">첫 번째 소모임을 만들어 보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
