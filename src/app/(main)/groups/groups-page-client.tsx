"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUP_CATEGORIES } from "@/types/group";
import { GroupList } from "@/components/groups/group-list";

type CategoryFilter = "all" | string;

export function GroupsPageClient() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-strong">소모임</h1>
          <p className="mt-1 text-sm text-text-muted">
            ASSIST 11기 소모임 목록
          </p>
        </div>
        <Link
          href="/groups/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
        >
          <Plus className="size-4" />
          소모임 만들기
        </Link>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "bg-brand text-white"
              : "bg-muted text-text-muted hover:text-text-strong",
          )}
        >
          전체
        </button>
        {GROUP_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat.value
                ? "bg-brand text-white"
                : "bg-muted text-text-muted hover:text-text-strong",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Groups grid */}
      <GroupList
        category={activeCategory === "all" ? undefined : activeCategory}
      />
    </div>
  );
}
