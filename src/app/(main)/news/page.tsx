import { getSession } from "@/lib/auth";
import { NewsPageClient } from "./news-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "IT 소식 - ASSIST 11기",
};

export default async function NewsPage() {
  const session = await getSession();

  return <NewsPageClient currentUserId={session?.sub} />;
}
