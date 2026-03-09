"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";

export function ScheduleWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>일정</CardTitle>
        <CardAction>
          <Link
            href="/events"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-2 py-6 text-text-muted">
          <CalendarDays className="size-8 opacity-40" />
          <p className="text-sm">등록된 일정이 없습니다</p>
        </div>
      </CardContent>
    </Card>
  );
}
