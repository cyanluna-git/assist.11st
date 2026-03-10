"use client";

import { useState } from "react";
import { Users2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useGroup, useJoinGroup, useLeaveGroup } from "@/hooks/use-groups";
import { useCurrentUser } from "@/hooks/use-current-user";
import { GROUP_CATEGORY_MAP } from "@/types/group";
import { GroupPostsTab } from "./group-posts-tab";
import { GroupScheduleTab } from "./group-schedule-tab";
import { GroupMembersTab } from "./group-members-tab";

type Tab = "intro" | "posts" | "schedule" | "members";

const TABS: { value: Tab; label: string }[] = [
  { value: "intro", label: "소개" },
  { value: "posts", label: "게시판" },
  { value: "schedule", label: "일정" },
  { value: "members", label: "멤버" },
];

interface GroupDetailClientProps {
  id: string;
}

export function GroupDetailClient({ id }: GroupDetailClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("intro");
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id;

  const { data: group, isLoading, isError } = useGroup(id);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-text-muted">
        <Users2 className="size-10 opacity-30" />
        <p className="text-sm">소모임을 찾을 수 없습니다</p>
        <Link
          href="/groups"
          className="text-xs text-brand hover:underline"
        >
          소모임 목록으로
        </Link>
      </div>
    );
  }

  const catInfo =
    group.category && group.category in GROUP_CATEGORY_MAP
      ? GROUP_CATEGORY_MAP[group.category as keyof typeof GROUP_CATEGORY_MAP]
      : null;

  const isLeader = currentUserId === group.leaderId;
  const isAtCapacity =
    group.maxMembers !== null && group.memberCount >= group.maxMembers;

  const handleJoin = () => {
    joinGroup.mutate(id);
  };

  const handleLeave = () => {
    if (!confirm("정말 이 소모임을 탈퇴하시겠습니까?")) return;
    leaveGroup.mutate(id);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1 text-sm text-text-muted transition-colors hover:text-text-strong"
      >
        <ArrowLeft className="size-4" />
        소모임 목록
      </Link>

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border bg-card">
        {/* Cover image */}
        <div className="relative h-40 w-full bg-gradient-to-br from-muted to-muted/60">
          {group.imageUrl ? (
            <img
              src={group.imageUrl}
              alt={group.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Users2 className="size-16 text-text-muted/30" />
            </div>
          )}
        </div>

        {/* Group info */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {catInfo && (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      catInfo.bg,
                      catInfo.color,
                    )}
                  >
                    {catInfo.label}
                  </span>
                )}
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Users2 className="size-3.5" />
                  <span>
                    {group.memberCount}
                    {group.maxMembers !== null && `/${group.maxMembers}`}명
                  </span>
                </div>
              </div>
              <h1 className="mt-2 text-xl font-bold text-text-strong">
                {group.name}
              </h1>
              {group.description && (
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {group.description}
                </p>
              )}
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {isLeader ? (
                <span className="inline-flex items-center rounded-lg bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
                  리더
                </span>
              ) : group.isMember ? (
                <button
                  onClick={handleLeave}
                  disabled={leaveGroup.isPending}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  {leaveGroup.isPending ? "처리 중..." : "탈퇴"}
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joinGroup.isPending || isAtCapacity}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
                >
                  {joinGroup.isPending
                    ? "처리 중..."
                    : isAtCapacity
                      ? "정원 마감"
                      : "가입하기"}
                </button>
              )}
            </div>
          </div>

          {/* Error messages */}
          {joinGroup.isError && (
            <p className="mt-2 text-xs text-red-500">
              {joinGroup.error?.message ?? "가입에 실패했습니다"}
            </p>
          )}
          {leaveGroup.isError && (
            <p className="mt-2 text-xs text-red-500">
              {leaveGroup.error?.message ?? "탈퇴에 실패했습니다"}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "bg-card text-text-strong shadow-sm"
                  : "text-text-muted hover:text-text-strong",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "intro" && (
            <div className="space-y-4">
              {/* Description */}
              {group.description ? (
                <div className="rounded-xl border bg-card p-5">
                  <h2 className="mb-2 text-sm font-semibold text-text-strong">소개</h2>
                  <p className="text-sm leading-relaxed text-text-muted whitespace-pre-wrap">
                    {group.description}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-text-muted">
                  소개가 없습니다
                </div>
              )}

              {/* Leader info */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold text-text-strong">리더</h2>
                <div className="flex items-center gap-3">
                  {group.leaderAvatar ? (
                    <img
                      src={group.leaderAvatar}
                      alt={group.leaderName ?? ""}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-text-muted">
                      {(group.leaderName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-text-strong">
                    {group.leaderName ?? "알 수 없음"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <GroupPostsTab groupId={id} isMember={group.isMember || isLeader} />
          )}

          {activeTab === "schedule" && (
            <GroupScheduleTab groupId={id} />
          )}

          {activeTab === "members" && (
            <GroupMembersTab groupId={id} leaderId={group.leaderId} />
          )}
        </div>
      </div>
    </div>
  );
}
