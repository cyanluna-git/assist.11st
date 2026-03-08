import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text-strong">
        ASSIST 11기 커뮤니티
      </h1>
      <p className="mt-2 text-text-muted">
        안녕하세요, {session?.name}님. 환영합니다.
      </p>
    </div>
  );
}
