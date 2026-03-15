import Link from "next/link";
import { getSession } from "@/lib/auth";
import {
  mobileAdminMenuItem,
  mobileMoreMenuGroups,
} from "@/lib/mobile-navigation";

export default async function MorePage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const AdminIcon = mobileAdminMenuItem.icon;

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand">Mobile Menu</p>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-strong">
            더보기
          </h1>
          <p className="text-sm text-text-muted">
            하단 탭에 없는 메뉴만 모아 둔 모바일 전용 메뉴 허브입니다.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {mobileMoreMenuGroups.map((group) => (
          <section key={group.title} className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-text-strong">{group.title}</h2>
              <p className="text-sm text-text-muted">
                {group.title === "커뮤니티" && "일상적인 탐색과 참여 메뉴를 모았습니다."}
                {group.title === "학술·정보" && "학술 자료와 정보성 콘텐츠를 빠르게 찾을 수 있습니다."}
                {group.title === "운영" && "기수 운영과 공지성 정보를 확인합니다."}
                {group.title === "계정" && "계정과 알림 관련 설정을 관리합니다."}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map(({ href, label, description, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-2xl border border-line-subtle bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-brand/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-brand/10 p-2 text-brand">
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-semibold text-text-strong">{label}</h3>
                      <p className="text-sm leading-6 text-text-muted">{description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {isAdmin && (
        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-text-strong">관리자</h2>
            <p className="text-sm text-text-muted">
              관리자 권한이 있는 계정에서만 보이는 운영 메뉴입니다.
            </p>
          </div>
          <Link
            href={mobileAdminMenuItem.href}
            className="group rounded-2xl border border-line-subtle bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-brand/5"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand/10 p-2 text-brand">
                <AdminIcon className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-semibold text-text-strong">
                  {mobileAdminMenuItem.label}
                </h3>
                <p className="text-sm leading-6 text-text-muted">
                  {mobileAdminMenuItem.description}
                </p>
              </div>
            </div>
          </Link>
        </section>
      )}
    </section>
  );
}
