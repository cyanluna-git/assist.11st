"use client";

import Link from "next/link";
import { Megaphone, ChevronRight } from "lucide-react";
import type { PostSummary } from "@/types/post";
import { formatDate } from "@/lib/format-date";

interface NoticeBannerProps {
  notices: PostSummary[];
}

export function NoticeBanner({ notices }: NoticeBannerProps) {
  if (!notices.length) return null;

  const latest = notices[0];

  return (
    <Link
      href="/posts?type=notice"
      className="group flex items-center gap-3 rounded-xl bg-brand/10 px-4 py-3 transition-colors hover:bg-brand/15"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
        <Megaphone className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-brand">
          {latest.title}
        </p>
        <p className="truncate text-xs text-text-muted">
          {formatDate(latest.createdAt)}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-brand opacity-50 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
