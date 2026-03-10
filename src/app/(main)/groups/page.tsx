import type { Metadata } from "next";
import { GroupsPageClient } from "./groups-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "소모임 | ASSIST 11기",
  description: "ASSIST 11기 소모임 목록",
};

export default function GroupsPage() {
  return <GroupsPageClient />;
}
