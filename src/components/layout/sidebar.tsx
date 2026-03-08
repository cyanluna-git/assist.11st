"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Users,
  Calendar,
  Image,
  BookOpen,
  Newspaper,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/posts", label: "게시판", icon: MessageSquare },
  { href: "/profiles", label: "프로필", icon: Users },
  { href: "/events", label: "일정", icon: Calendar },
  { href: "/gallery", label: "갤러리", icon: Image },
  { href: "/thesis", label: "논문", icon: BookOpen },
  { href: "/news", label: "IT 소식", icon: Newspaper },
  { href: "/polls", label: "투표", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col border-r border-line-subtle bg-surface md:flex lg:w-[272px]">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-line-subtle px-4 lg:px-6">
        <Link href="/" className="font-display text-lg font-semibold text-brand">
          <span className="hidden lg:inline">ASSIST 11기</span>
          <span className="lg:hidden">A11</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 lg:px-3">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-text-muted hover:bg-canvas hover:text-text-main",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-line-subtle px-2 py-3 lg:px-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-canvas hover:text-text-main"
        >
          <Settings className="size-5 shrink-0" />
          <span className="hidden lg:inline">설정</span>
        </Link>
      </div>
    </aside>
  );
}
