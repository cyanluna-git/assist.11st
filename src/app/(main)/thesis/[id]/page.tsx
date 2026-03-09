import type { Metadata } from "next";
import { ThesisDetailClient } from "./thesis-detail-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "논문 상세 | ASSIST 11기",
  description: "논문 상세 페이지",
};

export default function ThesisDetailPage() {
  return <ThesisDetailClient />;
}
