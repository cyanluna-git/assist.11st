import { getSession } from "@/lib/auth";
import { OrganizationPageClient } from "./organization-page-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "운영진 · 회칙 | aSSiST 11기",
};

export default async function OrganizationPage() {
  const session = await getSession();

  return <OrganizationPageClient currentUserRole={session?.role ?? "member"} />;
}
