"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Image, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/posts", label: "게시판", icon: MessageSquare },
  { href: "/gallery", label: "갤러리", icon: Image },
  { href: "/directory", label: "원우 카드", icon: Users },
  { href: "/more", label: "더보기", icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav data-slot="mobile-nav" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-surface md:hidden">
      <ul className="flex h-14 items-center justify-around">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-brand" : "text-text-muted",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
