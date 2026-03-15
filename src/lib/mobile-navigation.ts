import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bookmark,
  Calendar,
  ContactRound,
  GalleryVerticalEnd,
  Home,
  Menu,
  MessageSquare,
  Newspaper,
  ScrollText,
  Settings,
  Shield,
  Users2,
  UtensilsCrossed,
  Vote,
} from "lucide-react";

export interface MobileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  matchPrefixes?: string[];
}

export interface MobileMenuGroup {
  title: string;
  items: MobileNavItem[];
}

export const mobileBottomNavItems: MobileNavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/posts", label: "게시판", icon: MessageSquare },
  { href: "/lunch", label: "점심", icon: UtensilsCrossed },
  {
    href: "/directory",
    label: "프로필",
    icon: ContactRound,
    matchPrefixes: ["/directory", "/profiles"],
  },
  { href: "/more", label: "더보기", icon: Menu, matchPrefixes: ["/more", "/admin"] },
];

export const mobileMoreMenuGroups: MobileMenuGroup[] = [
  {
    title: "커뮤니티",
    items: [
      {
        href: "/events",
        label: "일정",
        description: "세미나, 행사, 내부 일정을 확인합니다.",
        icon: Calendar,
      },
      {
        href: "/groups",
        label: "소모임",
        description: "소모임 일정과 게시글을 확인합니다.",
        icon: Users2,
      },
      {
        href: "/gallery",
        label: "갤러리",
        description: "행사 사진과 업로드된 이미지를 모아봅니다.",
        icon: GalleryVerticalEnd,
      },
      {
        href: "/scraps",
        label: "스크랩",
        description: "저장해 둔 게시글과 뉴스 모음을 확인합니다.",
        icon: Bookmark,
      },
    ],
  },
  {
    title: "학술·정보",
    items: [
      {
        href: "/thesis",
        label: "논문",
        description: "논문 자료와 후기를 확인합니다.",
        icon: BookOpen,
      },
      {
        href: "/news",
        label: "IT 소식",
        description: "큐레이션된 뉴스와 댓글을 봅니다.",
        icon: Newspaper,
      },
      {
        href: "/polls",
        label: "투표",
        description: "운영 투표와 의견 수집에 참여합니다.",
        icon: Vote,
      },
    ],
  },
  {
    title: "운영",
    items: [
      {
        href: "/organization",
        label: "운영진 · 회칙",
        description: "11기 운영진 구성과 활동 회칙을 확인합니다.",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "계정",
    items: [
      {
        href: "/settings",
        label: "설정",
        description: "알림과 계정 설정을 관리합니다.",
        icon: Settings,
      },
    ],
  },
];

export const mobileAdminMenuItem: MobileNavItem = {
  href: "/admin",
  label: "관리자",
  description: "초대, 사용자, 운영 설정을 관리합니다.",
  icon: Shield,
};

function matchesPath(pathname: string, prefix: string) {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isMoreMenuRoute(pathname: string) {
  if (matchesPath(pathname, "/more")) {
    return true;
  }

  return mobileMoreMenuGroups.some((group) =>
    group.items.some((item) => matchesPath(pathname, item.href)),
  );
}

export function getActiveMobileBottomHref(pathname: string) {
  for (const item of mobileBottomNavItems) {
    const prefixes = item.matchPrefixes ?? [item.href];
    if (prefixes.some((prefix) => matchesPath(pathname, prefix))) {
      return item.href;
    }
  }

  return isMoreMenuRoute(pathname) ? "/more" : null;
}
