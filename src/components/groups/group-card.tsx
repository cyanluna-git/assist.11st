"use client";

import Link from "next/link";
import { Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GroupSummary } from "@/types/group";
import { GROUP_CATEGORY_MAP } from "@/types/group";

interface GroupCardProps {
  group: GroupSummary;
}

export function GroupCard({ group }: GroupCardProps) {
  const catInfo =
    group.category && group.category in GROUP_CATEGORY_MAP
      ? GROUP_CATEGORY_MAP[group.category as keyof typeof GROUP_CATEGORY_MAP]
      : null;

  const isAtCapacity =
    group.maxMembers !== null && group.memberCount >= group.maxMembers;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition-all duration-200 hover:ring-brand/30 hover:shadow-lg hover:shadow-brand/5"
    >
      {/* Image or placeholder */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/60">
        {group.imageUrl ? (
          <img
            src={group.imageUrl}
            alt={group.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Users2 className="size-10 text-text-muted/40" />
          </div>
        )}

        {/* Category badge */}
        {catInfo && (
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              catInfo.bg,
              catInfo.color,
            )}
          >
            {catInfo.label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-text-strong group-hover:text-brand">
            {group.name}
          </h3>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">
              {group.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          {/* Leader */}
          <div className="flex items-center gap-1.5">
            {group.leaderAvatar ? (
              <img
                src={group.leaderAvatar}
                alt={group.leaderName ?? ""}
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-text-muted">
                {(group.leaderName ?? "?")[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-text-muted">
              {group.leaderName ?? "알 수 없음"}
            </span>
          </div>

          {/* Member count + status */}
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5 text-xs text-text-muted">
              <Users2 className="size-3" />
              {group.memberCount}
              {group.maxMembers !== null && `/${group.maxMembers}`}
            </span>
            {group.isMember ? (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                멤버
              </span>
            ) : isAtCapacity ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                정원 마감
              </span>
            ) : (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-text-subtle">
                가입
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
