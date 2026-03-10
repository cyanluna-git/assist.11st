import type { Metadata } from "next";
import { GroupNewClient } from "@/components/groups/group-new-client";

export const metadata: Metadata = {
  title: "소모임 만들기 | ASSIST 11기",
  description: "ASSIST 11기 새 소모임 만들기",
};

export default function GroupNewPage() {
  return <GroupNewClient />;
}
