import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BabzipPageClient } from "./babzip-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "밥집 큐레이션 | aSSiST 11기",
};

export default async function BabzipPage() {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    redirect("/");
  }

  return <BabzipPageClient />;
}
