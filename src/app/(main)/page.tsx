import { getSession } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "대시보드 | aSSiST 11기",
};

export default async function HomePage() {
  const session = await getSession();

  return <DashboardClient userName={session?.name ?? "회원"} />;
}
