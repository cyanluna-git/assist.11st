"use client";

import { Users2 } from "lucide-react";
import { useGroupMembers } from "@/hooks/use-groups";

interface GroupMembersTabProps {
  groupId: string;
  leaderId: string;
}

export function GroupMembersTab({ groupId, leaderId }: GroupMembersTabProps) {
  const { data: members, isLoading, isError } = useGroupMembers(groupId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="size-5 animate-spin rounded-full border-2 border-muted border-t-brand" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-text-muted">
        <Users2 className="size-8 opacity-30" />
        <p className="text-sm">멤버를 불러올 수 없습니다</p>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-text-muted">
        <Users2 className="size-8 opacity-30" />
        <p className="text-sm">멤버가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {members.map((member) => {
        const isLeader = member.userId === leaderId;
        return (
          <div
            key={member.id}
            className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center"
          >
            {/* Avatar */}
            <div className="relative">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name ?? ""}
                  className="size-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-bold text-text-muted">
                  {(member.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              {isLeader && (
                <span className="absolute -top-1 -right-1 rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">
                  리더
                </span>
              )}
            </div>

            {/* Info */}
            <div>
              <p className="text-sm font-semibold text-text-strong">
                {member.name ?? "알 수 없음"}
              </p>
              {(member.company || member.position) && (
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {[member.company, member.position].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
