"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/notification-bell";

interface HeaderProps {
  user: { id: string; name: string; email: string; role: string };
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line-subtle bg-surface px-4 sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-text-strong lg:hidden">
          aSSiST <span className="text-xs text-text-muted">11기</span>
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          href={`/profiles/${user.id}`}
          className="hidden items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-canvas sm:flex"
          title="내 프로필 편집"
        >
          <User className="size-4 text-text-muted" />
          <span className="text-sm text-text-main">{user.name}</span>
          {user.role === "admin" && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              Admin
            </span>
          )}
        </Link>
        <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="로그아웃">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
