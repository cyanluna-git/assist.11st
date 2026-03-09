"use client";

import { cn } from "@/lib/utils";
import type { BoardType } from "@/types/post";

const TABS: { value: BoardType; label: string }[] = [
  { value: "notice", label: "공지" },
  { value: "free", label: "자유" },
  { value: "column", label: "칼럼" },
];

interface BoardTabsProps {
  value: BoardType;
  onChange: (value: BoardType) => void;
}

export function BoardTabs({ value, onChange }: BoardTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-card text-text-strong shadow-sm"
              : "text-text-muted hover:text-text-strong",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
