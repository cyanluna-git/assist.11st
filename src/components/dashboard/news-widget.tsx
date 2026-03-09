"use client";

import Link from "next/link";
import { Newspaper, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardAction, CardContent } from "@/components/ui/card";

export function NewsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>IT 소식</CardTitle>
        <CardAction>
          <Link
            href="/news"
            className="flex items-center gap-0.5 text-xs text-text-muted transition-colors hover:text-brand"
          >
            전체보기
            <ChevronRight className="size-3.5" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-2 py-6 text-text-muted">
          <Newspaper className="size-8 opacity-40" />
          <p className="text-sm">등록된 소식이 없습니다</p>
        </div>
      </CardContent>
    </Card>
  );
}
