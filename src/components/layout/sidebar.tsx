"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Users,
  ContactRound,
  Calendar,
  Image,
  BookOpen,
  Newspaper,
  BarChart3,
  Bookmark,
  Settings,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/providers/sidebar-provider";
import { useCurrentUser } from "@/hooks/use-current-user";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/posts", label: "게시판", icon: MessageSquare },
  { href: "/directory", label: "프로필", icon: ContactRound },
  { href: "/events", label: "일정", icon: Calendar },
  { href: "/gallery", label: "갤러리", icon: Image },
  { href: "/thesis", label: "논문", icon: BookOpen },
  { href: "/news", label: "IT 소식", icon: Newspaper },
  { href: "/polls", label: "투표", icon: BarChart3 },
  { href: "/scraps", label: "스크랩", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const { data: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line-subtle bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-[72px]" : "w-[72px] lg:w-[272px]",
      )}
    >
      {/* Logo + Collapse toggle */}
      <div className="flex h-14 items-center justify-between border-b border-line-subtle px-4 lg:px-5">
        <Link href="/" className="flex items-baseline gap-1 overflow-hidden">
          <span className={cn(
            "font-display text-lg font-semibold tracking-tight text-text-strong",
            collapsed ? "hidden" : "hidden lg:inline",
          )}>
            aSSiST
          </span>
          <span className={cn(
            "font-display text-lg font-semibold tracking-tight text-text-strong",
            collapsed ? "inline" : "lg:hidden",
          )}>
            aS
          </span>
          <span className={cn(
            "text-xs text-text-muted",
            collapsed ? "hidden" : "hidden lg:inline",
          )}>
            11기
          </span>
        </Link>
        <button
          onClick={toggle}
          className={cn(
            "hidden rounded-md p-1 text-text-muted transition-colors hover:bg-canvas hover:text-text-main",
            collapsed ? "lg:hidden" : "lg:flex",
          )}
          title={collapsed ? "사이드바 열기" : "사이드바 접기"}
        >
          <PanelLeftClose className="size-4" />
        </button>
        <button
          onClick={toggle}
          className={cn(
            "hidden rounded-md p-1 text-text-muted transition-colors hover:bg-canvas hover:text-text-main",
            collapsed ? "lg:flex" : "lg:hidden",
          )}
          title="사이드바 열기"
        >
          <PanelLeftOpen className="size-4" />
        </button>
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
                  title={label}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand/10 text-brand"
                      : "text-text-muted hover:bg-canvas hover:text-text-main",
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className={cn(
                    collapsed ? "hidden" : "hidden lg:inline",
                  )}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-line-subtle px-2 py-3 lg:px-3">
        {isAdmin && (
          <Link
            href="/admin"
            title="관리자"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-brand/10 text-brand"
                : "text-text-muted hover:bg-canvas hover:text-text-main",
            )}
          >
            <Shield className="size-5 shrink-0" />
            <span className={cn(
              collapsed ? "hidden" : "hidden lg:inline",
            )}>관리자</span>
          </Link>
        )}
        <Link
          href="/settings"
          title="설정"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-canvas hover:text-text-main"
        >
          <Settings className="size-5 shrink-0" />
          <span className={cn(
            collapsed ? "hidden" : "hidden lg:inline",
          )}>설정</span>
        </Link>
      </div>
    </aside>
  );
}
