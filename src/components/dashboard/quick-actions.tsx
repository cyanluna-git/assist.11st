"use client";

import Link from "next/link";
import { PenSquare, MessageSquare, Users, Calendar } from "lucide-react";

const actions = [
  { href: "/posts/write", label: "글쓰기", icon: PenSquare },
  { href: "/posts", label: "게시판", icon: MessageSquare },
  { href: "/directory", label: "원우 카드", icon: Users },
  { href: "/events", label: "일정", icon: Calendar },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-surface p-3 text-text-muted ring-1 ring-foreground/10 transition-colors hover:bg-canvas hover:text-brand sm:p-4"
        >
          <Icon className="size-5" />
          <span className="text-xs font-medium">{label}</span>
        </Link>
      ))}
    </div>
  );
}
