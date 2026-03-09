import type { Metadata } from "next";
import { PollsPageClient } from "./polls-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "투표 | ASSIST 11기",
  description: "ASSIST 11기 투표 및 설문",
};

export default function PollsPage() {
  return <PollsPageClient />;
}
