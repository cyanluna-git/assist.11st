import type { Metadata } from "next";
import { ScrapsPageClient } from "./scraps-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "스크랩 | ASSIST 11기",
};

export default function ScrapsPage() {
  return <ScrapsPageClient />;
}
