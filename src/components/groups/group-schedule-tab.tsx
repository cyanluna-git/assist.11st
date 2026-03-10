"use client";

import { useMemo } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { useGroupEvents } from "@/hooks/use-groups";
import { CATEGORY_MAP } from "@/types/event";
import type { EventCategory } from "@/types/event";
import { cn } from "@/lib/utils";

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const period = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${period} ${hour}:${m}`;
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${month}/${day} (${weekday})`;
}

interface GroupScheduleTabProps {
  groupId: string;
}

export function GroupScheduleTab({ groupId }: GroupScheduleTabProps) {
  const now = useMemo(() => new Date(), []);
  const from = useMemo(() => now.toISOString(), [now]);
  const to = useMemo(
    () =>
      new Date(
        now.getFullYear(),
        now.getMonth() + 3,
        0,
      ).toISOString(),
    [now],
  );

  const { data: events, isLoading, isError } = useGroupEvents(groupId, from, to);

  const upcoming = useMemo(() => {
    if (!events) return [];
    return [...events]
      .filter((ev) => new Date(ev.startAt).getTime() >= now.getTime() - 86400000)
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [events, now]);

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
        <CalendarDays className="size-8 opacity-30" />
        <p className="text-sm">일정을 불러올 수 없습니다</p>
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-12 text-text-muted">
        <CalendarDays className="size-8 opacity-30" />
        <p className="text-sm">다가오는 일정이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {upcoming.map((ev) => {
        const cat = ev.category as EventCategory | null;
        const catInfo = cat ? CATEGORY_MAP[cat] : null;

        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/50"
          >
            {/* Date column */}
            <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted py-1.5 text-center">
              <span className="text-[10px] leading-none text-text-muted">
                {formatDayLabel(ev.startAt).split(" ")[0]}
              </span>
              <span className="text-xs font-semibold leading-tight text-text-strong">
                {formatDayLabel(ev.startAt).split(" ")[1]}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {catInfo && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-1.5 py-px text-[9px] font-medium",
                      catInfo.bg,
                      catInfo.color,
                    )}
                  >
                    {catInfo.label}
                  </span>
                )}
                <span className="truncate text-sm font-medium text-text-strong">
                  {ev.title}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                <span className="flex items-center gap-0.5">
                  <Clock className="size-2.5" />
                  {formatTime(ev.startAt)}
                  {ev.endAt && ` - ${formatTime(ev.endAt)}`}
                </span>
                {ev.location && (
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin className="size-2.5" />
                    {ev.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
