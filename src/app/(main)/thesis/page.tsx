import type { Metadata } from "next";
import { ThesisPageClient } from "./thesis-page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "논문 | ASSIST 11기",
  description: "ASSIST 11기 논문 게시판",
};

export default function ThesisPage() {
  return <ThesisPageClient />;
}
