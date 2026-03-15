"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getActiveMobileBottomHref,
  mobileBottomNavItems,
} from "@/lib/mobile-navigation";

export function MobileNav() {
  const pathname = usePathname();
  const activeHref = getActiveMobileBottomHref(pathname);

  return (
    <nav data-slot="mobile-nav" className="fixed inset-x-0 bottom-0 z-40 border-t border-line-subtle bg-surface md:hidden">
      <ul className="flex h-14 items-center justify-around">
        {mobileBottomNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = activeHref === href;
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
